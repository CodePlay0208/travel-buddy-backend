const logger = require("../logger");
const baseTripRepository = require("../repositories/BaseTripRepository.js");
const tripInstancesRepository = require("../repositories/TripInstanceRepository.js");
const userTripsRepository = require("../repositories/UserTripsRepository.js");
const userProfileRepository = require("../repositories/UserProfileRepository.js");
const notificationRepository = require("../repositories/NotificationRepository.js");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
  generatePresignedUrlFromS3,
} = require("../aws/S3");
const { dateFromDateString, parseLimitAndOffset } = require("../Utils");
const { v4: uuidv4 } = require("uuid");
const { ValidationError } = require("../exceptions/ValidationError.js");
const tripValidator = require("../validators/TripValidator.js");
const generateToken = require("../config/GenerateToken.js");
const { cropAndResizeImages } = require("../Utils.js");
const {
  USER_PROFILE_PROJECTION_IN_TRIP_DETAILS,
  USER_PROFILE_PROJECTION_IN_SEARCH_CARD,
  USER_PROFILE_PROJECTION,
} = require("../constants/Projections.js");
const { randomFileName } = require("../Utils");
const NotificationEvents = require("../enums/NotificationEvents.js");
const chatService = require("../service/ChatService.js");

async function addJoinedMembersProfilesToTrip(trip, projection) {
  trip.joinedMembers = await userProfileRepository.findUsersByUserId(
    trip.tripMembersIds
  );
}

async function addRequestedMembersProfilesToTrip(trip, projection) {
  trip.requestingMembers = await userProfileRepository.findUsersByUserId(
    trip.requestingTripMembersIds
  );
}

async function updateMemberProfiles(members) {
  return Promise.all(
    members.map(async (originaMember) => {
      let member = originaMember;
      member.profilePic = await getObjectsFromS3Bucket(
        "",
        member.profilePic,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      return member;
    })
  );
}

async function updateJoinedMembersProfilesInTrip(trip, projection) {
  await addJoinedMembersProfilesToTrip(trip, projection);
  const [updatedJoinedMembers] = await Promise.all([
    updateMemberProfiles(trip.joinedMembers),
  ]);
  trip.joinedMembers = updatedJoinedMembers;
}

async function updateRequestedMembersProfilesInTrip(trip, projection) {
  await addRequestedMembersProfilesToTrip(trip, projection);
  const [updatedRequestedMembers] = await Promise.all([
    updateMemberProfiles(trip.requestingMembers),
  ]);
  trip.requestingMembers = updatedRequestedMembers;
}

async function getRelatedDatesToBaseTrip(fetchedTrips) {
  return await Promise.all(
    fetchedTrips.map(async (trip) => {
      const baseTripId = trip.baseTripId;
      const tripInstances = await tripInstancesRepository.getTripsByBaseTripId(
        baseTripId
      );
      trip.relatedTrips = tripInstances.map((trip) => {
        const startDate = trip.startDate;
        const endDate = trip.endDate;
        const tripInstanceId = trip.tripInstanceId;
        return { startDate, endDate, tripInstanceId };
      });
      return trip;
    })
  );
}

async function populateTripsUsingUserTripsQuery(query, skip, limitNumber) {
  const userTrips = await userTripsRepository.getUserTripsUsingQuery(
    query,
    skip,
    limitNumber
  );

  if (!userTrips || userTrips.length === 0) {
    return [];
  }

  const fetchedUserTrips = userTrips;

  var fetchedUserTripsIds = [];

  fetchedUserTrips.forEach((fetchedUserTrip) => {
    fetchedUserTripsIds.push(fetchedUserTrip.tripInstanceId);
  });

  const fetchedTrips =
    await tripInstancesRepository.findTripsWithQueryUsingAggregation(
      {
        tripInstanceId: { $in: fetchedUserTripsIds },
      },
      limitNumber,
      skip,
      {}
    );

  let fetchedTripsObj = fetchedTrips;

  fetchedTripsObj = await addCroppedDestinationImagesToTrips(
    fetchedTripsObj,
    process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES
  );

  await Promise.all(
    fetchedTripsObj.map(async (trip) => {
      await updateJoinedMembersProfilesInTrip(
        trip,
        USER_PROFILE_PROJECTION_IN_SEARCH_CARD
      );
    })
  );
  return fetchedTripsObj;
}

function addDestinationToQuery(query, destination) {
  if (destination) {
    query.destination = { $in: [destination] };
  }
}

function addMinTotalMemberToQuery(query, minTotalMember) {
  if (minTotalMember) {
    query.minTotalMember = minTotalMember;
  }
}

function addMaxTotalMemberToQuery(query, maxTotalMember) {
  if (maxTotalMember) {
    query.maxTotalMember = maxTotalMember;
  }
}

function addPersonaToQuery(query, persona) {
  if (persona) {
    query.persona = persona;
  }
}

function addDateToQuery(query, queryDate, fetchPastTrips) {
  if (queryDate) {
    if (!isNaN(queryDate)) {
      const queryStartDate = new Date(queryDate);
      const queryEndDate = queryDate.setUTCHours(23, 59, 59, 999);
      query.startDate = { $gte: queryStartDate, $lt: queryDate };
    } else {
      logger.error("Invalid date passed in query");
      throw new ValidationError("Invalid Date Passed");
    }
  } else if (!fetchPastTrips) {
    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);
    query.startDate = { $gte: todayDate };
  }
}

function excludeUserIdFromQuery(query, userId) {
  if (userId) {
    query.hostId = { $ne: userId };
  }
}

function addUserIdToQuery(query, userId) {
  if (userId) {
    query.hostId = userId;
  }
}

function addTripInstanceIdToQuery(query, tripInstanceId) {
  if (tripInstanceId) {
    query.tripInstanceId = tripInstanceId;
  }
}

function addBaseTripIdToQuery(query, baseTripId) {
  if (baseTripId) {
    query.baseTripId = baseTripId;
  }
}

function addStartLocationToQuery(query, startLocation) {
  if (startLocation) {
    logger.debug(`Adding startLocation to query: startLocation=${startLocation}`);
    query.startLocation = { $in: [startLocation] };
  }
}

function createQuery(
  destination,
  date,
  userId,
  includeUser,
  tripInstanceId,
  fetchPastTrips,
  startLocation
) {
  let query = {};
  addDestinationToQuery(query, destination);
  addStartLocationToQuery(query, startLocation);
  addDateToQuery(query, date, fetchPastTrips);
  includeUser
    ? addUserIdToQuery(query, userId)
    : excludeUserIdFromQuery(query, userId);
  addTripInstanceIdToQuery(query, tripInstanceId);
  return query;
}

function createAdditionalFilters(filter) {
  let query = {};
  addPersonaToQuery(query, filter.persona);
  addMinTotalMemberToQuery(query, filter.minTotalMember);
  addMaxTotalMemberToQuery(query, filter.maxTotalMember);


  if (filter.minDuration) query.minDuration = filter.minDuration;
  if (filter.maxDuration) query.maxDuration = filter.maxDuration;
  if (filter.minBudget) query.minBudget = filter.minBudget;
  if (filter.maxBudget) query.maxBudget = filter.maxBudget;


  if (filter.sortBy) query.sortBy = filter.sortBy;


  if (filter.preferences) {
    let preferencesArr = filter.preferences;
    if (typeof preferencesArr === "string") {
      try {
        preferencesArr = JSON.parse(preferencesArr);
      } catch (e) {
        preferencesArr = [preferencesArr];
      }
    }
    if (Array.isArray(preferencesArr) && preferencesArr.length > 0) {
      query.preferences = preferencesArr;
    }
  }


  if (filter.tripDatesSoonest) query.tripDatesSoonest = filter.tripDatesSoonest;

  return query;
}

function createQueryForBaseTrips(
  destination,
  date,
  userId,
  includeUser,
  baseTripId,
  startLocation
) {
  let query = {};
  addDestinationToQuery(query, destination);
  addStartLocationToQuery(query, startLocation);
  addDateToQuery(query, date, true);
  includeUser
    ? addUserIdToQuery(query, userId)
    : excludeUserIdFromQuery(query, userId);
  addBaseTripIdToQuery(query, baseTripId);
  return query;
}

function createQueryForUserTrips(
  userId,
  tripInstanceId,
  isJoined,
  isRequested,
  isWishlisted,
  isPublished
) {
  let query = {};
  if (userId) {
    query.userId = userId;
  }
  if (tripInstanceId) {
    query.tripInstanceId = tripInstanceId;
  }
  if (isJoined != null) {
    query.isJoined = isJoined;
  }
  if (isWishlisted != null) {
    query.isWishlisted = isWishlisted;
  }
  if (isRequested != null) {
    query.isRequested = isRequested;
  }
  if (isPublished != null) {
    query.isPublished = isPublished;
  }
  return query;
}

async function getTripsUsingQueryWithLimitAndOffset(
  query,
  limit,
  offset,
  additionalFilters
) {
  const { skip, limitNumber, newOffset } = parseLimitAndOffset(
    limit,
    offset,
    parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
  );
  const trips = await baseTripRepository.findTripsWithQueryUsingAggregation(
    query,
    limitNumber,
    skip,
    additionalFilters
  );

  return { trips, newOffset };
}

async function getTripInstancesUsingQueryWithLimitAndOffset(
  query,
  limit,
  offset,
  additionalFilters
) {
  const { skip, limitNumber, newOffset } = parseLimitAndOffset(
    limit,
    offset,
    parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
  );
  const trips =
    await tripInstancesRepository.findTripsWithQueryUsingAggregation(
      query,
      limitNumber,
      skip,
      additionalFilters
    );

  return { trips, newOffset };
}

async function addCroppedDestinationImagesToTrips(trips, path) {
  trips = await Promise.all(
    trips.map(async (trip) => {
      const res = await getObjectsFromS3Bucket(
        path,
        trip.croppedDestinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );
      trip.croppedDestinationImages = res;
      return trip;
    })
  );

  return trips;
}

async function createTrip(payload, userId) {
  try {
    const baseTripId = uuidv4();
    const baseTrip = {
      destination: payload.destination,
      startLocation: payload.startLocation,
      minBudget: payload.minBudget,
      maxBudget: payload.maxBudget,
      title: payload.title,
      description: payload.description,
      dayTabs: payload.dayTabs,
      inc_exc: payload.inc_exc,
      baseTripId,
      hostId: userId,
      duration: payload.duration,
      scheduledWeekdays: payload.scheduledWeekdays,
      preferences: payload.preferences || [],
    };

    const createdBaseTrip = await baseTripRepository.createTrip(baseTrip);
    const { tripDates: strTripDates } = payload;
    const tripDates = Array.from(strTripDates);

    const tripInstances = tripDates.map((tripDate) => {
      const { startDate, endDate } = tripDate;
      const queryStartDate = dateFromDateString(startDate);
      const queryEndDate = dateFromDateString(endDate);
      const tripInstanceId = uuidv4();
      const tripInstance = {
        tripInstanceId,
        baseTripId,
        hostId: userId,
        destination: payload.destination,
        startLocation: payload.startLocation,
        startDate: queryStartDate,
        endDate: queryEndDate,
        preferences: payload.preferences || [],
      };
      return tripInstance;
    });

    const createdTripInstances = await tripInstancesRepository.createInstances(
      tripInstances
    );

    await Promise.all(
      tripInstances.map((tripInstance) =>
        userTripsRepository.updateUserTrips(
          userId,
          tripInstance.tripInstanceId,
          true,
          true,
          false,
          false
        )
      )
    );

    chatService.createChat(tripInstances, userId, payload.title);
    return baseTripId;
  } catch (error) {
    logger.error(
      `Error creating trip with payload=${JSON.stringify(
        payload
      )}, error=${error}`
    );
    throw error;
  }
}

async function getTripById(tripInstanceId, userId) {
  try {
    let trip = await tripInstancesRepository.findTripWithTripId(tripInstanceId);
    if (!trip || trip.length == 0) {
      throw new ValidationError(
        `Trip not found for tripInstanceId=${tripInstanceId}`,
        400
      );
    }

    let fetchedTrip = trip[0];
    fetchedTrip.destinationImages = await getObjectsFromS3Bucket(
      process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
      fetchedTrip.destinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    const query = createQueryForUserTrips(
      null,
      tripInstanceId,
      true,
      null,
      null,
      null
    );

    const joinedTrips = await userTripsRepository.getUserTripsUsingQuery(query);

    let joinedUsers = [];

    joinedTrips.forEach((userTrip) => {
      joinedUsers.push(userTrip.userId);
    });

    fetchedTrip.isJoined = false;
    fetchedTrip.isWishlisted = false;
    fetchedTrip.isRequested = false;

    if (userId) {
      const userQuery = createQueryForUserTrips(
        userId,
        tripInstanceId,
        null,
        null,
        null,
        null,
        null
      );

      const userBasedTrips = await userTripsRepository.getUserTripsUsingQuery(
        userQuery
      );

      if (userBasedTrips && userBasedTrips.length > 0) {
        fetchedTrip.isJoined = userBasedTrips[0].isJoined;
        fetchedTrip.isWishlisted = userBasedTrips[0].isWishlisted;
        fetchedTrip.isRequested = userBasedTrips[0].isRequested;
      }
    }

    fetchedTrip.tripMembersIds = joinedUsers;

    await updateJoinedMembersProfilesInTrip(
      fetchedTrip,
      USER_PROFILE_PROJECTION_IN_TRIP_DETAILS
    );

    fetchedTrip = await getRelatedDatesToBaseTrip(Array.of(fetchedTrip));

    logger.info(
      `fetched trip with tripInstanceId=${tripInstanceId}, trip=${JSON.stringify(
        fetchedTrip
      )}`
    );
    return fetchedTrip;
  } catch (error) {
    logger.error(
      `Error while fetching trip with tripInstanceId=${tripInstanceId}, error=${error}`
    );
    throw error;
  }
}

async function editTrip(baseTripId, userId, newPayload) {
  try {
    const tripInDatabase = await baseTripRepository.findTripWithTripId(
      baseTripId
    );
    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip with baseTripId=${baseTripId} not found`,
        400
      );
    }

    const user = await userProfileRepository.findAdminByUserId(userId);
    if (!(tripInDatabase.hostId == userId) && !user) {
      throw new ValidationError(
        `User with userId=${userId} not authorized to edit trip with baseTripId=${baseTripId}`,
        403
      );
    }

    if (newPayload.newTripDates && newPayload.newTripDates.length != 0) {
      const { newTripDates: strTripDates } = newPayload;
      const newTripDates = Array.from(strTripDates);
      const tripInstances = newTripDates.map((tripDate) => {
        const { startDate, endDate } = tripDate;
        const queryStartDate = dateFromDateString(startDate);
        const queryEndDate = dateFromDateString(endDate);
        const tripInstanceId = uuidv4();
        const tripInstance = {
          tripInstanceId,
          baseTripId,
          hostId: userId,
          destination: tripInDatabase.destination,
          startLocation: tripInDatabase.startLocation,
          startDate: queryStartDate,
          endDate: queryEndDate,
        };
        return tripInstance;
      });

      const createdTripInstances =
        await tripInstancesRepository.createInstances(tripInstances);
    }

    if (
      newPayload.removedTripDates &&
      newPayload.removedTripDates.length != 0
    ) {
      const { removedTripDates: strTripDates } = newPayload;
      const removedTripDates = Array.from(strTripDates);
      const deletedDates = removedTripDates.map((tripDate) => {
        const { startDate, endDate } = tripDate;
        const queryStartDate = dateFromDateString(startDate);
        const queryEndDate = dateFromDateString(endDate);
        return { startDate: queryStartDate, endDate: queryEndDate, baseTripId };
      });
      await tripInstancesRepository.deleteTripDates(deletedDates);
    }

    if (
      newPayload.removedDestinationImages &&
      newPayload.removedDestinationImages.length > 0
    ) {

      const imagesToRemove = new Set([
        ...(newPayload.removedDestinationImages || []),
        ...(newPayload.removedCroppedDestinationImages || [])
      ]);

      tripInDatabase.destinationImages = tripInDatabase.destinationImages.filter(
        (image) => !imagesToRemove.has(image)
      );
      tripInDatabase.croppedDestinationImages = tripInDatabase.croppedDestinationImages.filter(
        (image) => !imagesToRemove.has(image)
      );

      const s3Promises = [
        deleteObjectsFromS3Bucket(
          process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
          newPayload.removedDestinationImages,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        ),
        deleteObjectsFromS3Bucket(
          process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
          newPayload.removedCroppedDestinationImages,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        )
      ];

      const s3Results = await Promise.all(s3Promises);
      if (!s3Results.every((result) => result)) {
        throw new Error("Failed to delete all images from S3");
      }
    }
    Object.entries(newPayload).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        key != "__v" &&
        key != "_id" &&
        key != "createdAt" &&
        key != "hostId" &&
        key != "removedDestinationImages" &&
        key != "removedCroppedDestinationImages" &&
        key != "croppedDestinationImages" &&
        key != "destinationImages"
      ) {
        tripInDatabase[key] = value;
      }
    });

    if (newPayload.startLocation || newPayload.destination) {
      let query = {};
      if (newPayload.startLocation) {
        query.startLocation = newPayload.startLocation;
      }
      if (newPayload.destination) {
        query.destination = newPayload.destination;
      }
      tripInstancesRepository.updateTrips(baseTripId, query);
    }

    const updatedTrip = await baseTripRepository.updateTrip(tripInDatabase);
    logger.info(`Trip with baseTripId=${baseTripId} updated successfully`);

    return updatedTrip;
  } catch (error) {
    logger.error(
      `Error editing trip with newPayload=${JSON.stringify(
        newPayload
      )}, error=${error}`
    );
    throw error;
  }
}

async function createTripsImages(payload) {
  const objectKey = payload.detail.object.key;
  try {
    const parts = objectKey.split("/");
    const folder = parts[0];
    const userId = parts[1];
    const baseTripId = parts[2];
    const fileName = parts.slice(3).join("/");
    const tripInDatabase = await baseTripRepository.findTripWithTripId(
      baseTripId
    );
    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip with baseTripId=${baseTripId} not found`,
        400
      );
    }

    if (!tripInDatabase.hostId == userId) {
      throw new ValidationError(
        `User with userId=${userId} not authorized to edit trip with baseTripId=${baseTripId}`,
        403
      );
    }

    if (folder == process.env.S3_FOLDER_FOR_FULL_DESTINATION_IMAGES) {
      tripInDatabase.destinationImages.push(objectKey);
    } else if (folder == process.env.S3_FOLDER_FOR_CROPPED_DESTINATION_IMAGES) {
      tripInDatabase.croppedDestinationImages.push(objectKey);
    }

    const updatedTrip = await baseTripRepository.updateTrip(tripInDatabase);
    logger.info(`created images for Trip with baseTripId=${baseTripId}`);
  } catch (error) {
    logger.error(
      `Error creating images for baseTripId=${JSON.stringify(payload)}, error=${error}`
    );
    throw error;
  }
}

async function getTripsByUser(filter, userId) {
  try {
    const {
      offset = 0,
      limit = parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10),
    } = filter;
    tripValidator.validateLimit(limit);

    const { skip, limitNumber } = parseLimitAndOffset(
      limit,
      offset,
      parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
    );

    const query = createQueryForBaseTrips(null, null, userId, true, null);
    const additionalFilters = createAdditionalFilters(filter);
    var { trips, newOffset } = await getTripsUsingQueryWithLimitAndOffset(
      query,
      limitNumber,
      skip,
      additionalFilters
    );

    let fetchedTrips = trips;
    fetchedTrips = await getRelatedDatesToBaseTrip(fetchedTrips);

    fetchedTrips = await addCroppedDestinationImagesToTrips(
      fetchedTrips,
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES
    );

    logger.info(
      `Fetched wishlisted trips for user with userId=${userId}, trips=${fetchedTrips}`
    );
    return { trips: fetchedTrips, newOffset };
  } catch (error) {
    logger.error(
      `failed to fetch wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function getTripsWithFilter(filter, userId) {
  try {
    const {
      destination,
      startLocation,
      offset = 0,
      limit = parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10),
    } = filter;

    const queryDate = dateFromDateString(filter.date);
    tripValidator.validateFilter(filter);
    let fetchedTrips;
    if (filter.date || filter.minTotalMember || filter.maxTotalMembers) {
      const query = createQuery(
        destination,
        queryDate,
        userId,
        false,
        null,
        false,
        startLocation
      );

      const additionalFilters = createAdditionalFilters(filter);
      var { trips, newOffset } =
        await getTripInstancesUsingQueryWithLimitAndOffset(
          query,
          limit,
          offset,
          additionalFilters
        );
      if (trips.length === 0) {
        return [];
      }

      fetchedTrips = trips;
      fetchedTrips = await Promise.all(
        fetchedTrips.map(async (trip) => {
          const userTripsQuery = createQueryForUserTrips(
            null,
            trip.tripInstanceId,
            true,
            null,
            null,
            null
          );
          let joinedUsers = [];

          const joinedTrips = await userTripsRepository.getUserTripsUsingQuery(
            userTripsQuery
          );

          joinedTrips.forEach((userTrip) => {
            joinedUsers.push(userTrip.userId);
          });

          trip.tripMembersIds = joinedUsers;
          return trip;
        })
      );
    } else {
      const query = createQueryForBaseTrips(
        destination,
        null,
        userId,
        false,
        null,
        startLocation
      );
      const additionalFilters = createAdditionalFilters(filter);
      var { trips, newOffset } = await getTripsUsingQueryWithLimitAndOffset(
        query,
        limit,
        offset,
        additionalFilters
      );

      if (trips.length === 0) {
        return [];
      }

      fetchedTrips = trips;
      fetchedTrips = await getRelatedDatesToBaseTrip(fetchedTrips);
      fetchedTrips = await Promise.all(
        fetchedTrips.map(async (trip) => {
          if (!trip || trip.relatedTrips.length == 0) {
            logger.error(
              `baseTrip with empty tripInstances found, trip=${trip}`
            );
            return;
          }
          trip.tripInstanceId = trip.relatedTrips[0].tripInstanceId;
          trip.startDate = trip.relatedTrips[0].startDate;
          trip.endDate = trip.relatedTrips[0].endDate;
          const userTripsQuery = createQueryForUserTrips(
            null,
            trip.relatedTrips[0].tripInstanceId,
            true,
            null,
            null,
            null
          );
          let joinedUsers = [];

          const joinedTrips = await userTripsRepository.getUserTripsUsingQuery(
            userTripsQuery
          );

          joinedTrips.forEach((userTrip) => {
            joinedUsers.push(userTrip.userId);
          });

          trip.tripMembersIds = joinedUsers;
          return trip;
        })
      );
    }

    fetchedTrips = fetchedTrips.filter(
      (trip) => trip != null && trip != undefined
    );
    await addCroppedDestinationImagesToTrips(
      fetchedTrips,
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES
    );

    await Promise.all(
      fetchedTrips.map(async (trip) => {
        await updateJoinedMembersProfilesInTrip(
          trip,
          USER_PROFILE_PROJECTION_IN_SEARCH_CARD
        );
      })
    );

    return { trips: fetchedTrips, newOffset };
  } catch (error) {
    logger.error(
      `failed to fetch trips with filter=${JSON.stringify(
        filter
      )}, error=${error}`
    );
    throw error;
  }
}

async function getRandomTrips(filter, userId) {
  try {
    const { limit = parseInt(process.env.LIMIT_FOR_SENDING_RANDOM_TRIPS, 10) } =
      filter;
    const parsedLimit = parseInt(limit, 10);
    tripValidator.validateFilter(filter);
    const query = createQuery(null, null, userId, false, null, false);
    let fetchedTrips =
      await tripInstancesRepository.findRandomTripsWithQueryUsingAggregation(
        query,
        parsedLimit
      );
    await addCroppedDestinationImagesToTrips(
      fetchedTrips,
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES
    );

    await Promise.all(
      fetchedTrips.map(async (trip) => {
        await updateJoinedMembersProfilesInTrip(
          trip,
          USER_PROFILE_PROJECTION_IN_SEARCH_CARD
        );
      })
    );

    return { trips: fetchedTrips };
  } catch (error) {
    logger.error(`failed to fetch trips with filter=${filter}, error=${error}`);
    throw error;
  }
}

async function deleteBaseTrip(baseTripId, userId) {
  try {
    const query = createQueryForBaseTrips(null, null, userId, true, baseTripId);
    const tripInDatabase = await tripInstancesRepository.findTripsWithQuery(
      query,
      50,
      0
    );

    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip not found or user doesn't have permssion to delete trip with baseTripId=${baseTripId}, userId=${userId}`,
        400
      );
    }

    await tripInstancesRepository.deleteTripsByBaseTripId(baseTripId);

    deleteObjectsFromS3Bucket(
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
      tripInDatabase.destinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    deleteObjectsFromS3Bucket(
      process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
      tripInDatabase.destinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    await baseTripRepository.deleteTripsByTripId(baseTripId);
    logger.info(`Trip with baseTripId=${baseTripId} deleted successfully`);
  } catch (error) {
    logger.error(
      `Error deleting trip with baseTripId=${baseTripId}, error=${error}`
    );
    throw error;
  }
}

async function deleteTripInstance(tripInstanceId, userId) {
  try {
    const query = createQuery(null, null, userId, true, tripInstanceId, null);
    const tripInDatabase = await tripInstancesRepository.findTripsWithQuery(
      query,
      50,
      0
    );

    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip not found or user doesn't have permssion to delete trip with tripInstanceId=${tripInstanceId}, userId=${userId}`,
        400
      );
    }

    await tripInstancesRepository.deleteTripsByTripInstanceId(tripInstanceId);
    logger.info(
      `Trip with tripInstanceId=${tripInstanceId} deleted successfully`
    );
  } catch (error) {
    logger.error(
      `Error deleting trip with tripInstanceId=${tripInstanceId}, error=${error}`
    );
    throw error;
  }
}

async function getWishlistedTrips(filter, userId) {
  try {
    const {
      offset = 0,
      limit = parseInt(process.env.LIMIT_FOR_SENDING_WISHLISTED_TRIPS, 10),
    } = filter;
    tripValidator.validateLimit(limit);
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }

    const { skip, limitNumber, newOffset } = parseLimitAndOffset(
      limit,
      offset,
      parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
    );

    const wishlistedQuery = createQueryForUserTrips(
      userId,
      null,
      null,
      null,
      true,
      null
    );

    const fetchedTrips = await populateTripsUsingUserTripsQuery(
      wishlistedQuery,
      skip,
      limitNumber
    );

    logger.info(
      `Fetched wishlisted trips for user with userId=${userId}, trips=${fetchedTrips}`
    );
    return { trips: fetchedTrips, newOffset };
  } catch (error) {
    logger.error(
      `failed to fetch wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function addWishlistTrip(tripInstanceId, userId) {
  try {
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    const addedTrip = await userTripsRepository.updateWishlistTripForUser(
      userId,
      tripInstanceId,
      true
    );
    logger.info(
      `added tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId} with result=${addedTrip}`
    );
  } catch (error) {
    logger.error(
      `failed to add tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}`
    );
    throw error;
  }
}

async function removeWishlistedTrip(tripInstanceId, userId) {
  try {
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    const trip = await userTripsRepository.updateWishlistTripForUser(
      userId,
      tripInstanceId,
      false
    );
    logger.info(
      `removed tripInstanceId=${tripInstanceId} from wishlisted trips for user with userId=${userId} with result=${trip}`
    );
  } catch (error) {
    logger.error(
      `failed to remove tripInstanceId=${tripInstanceId} from wishlisted trips for user with userId=${userId}`
    );
    throw error;
  }
}

async function requestJoinTrip(payload, userId) {
  try {
    const { tripInstanceId, hostId } = payload;
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    const query = createQueryForUserTrips(
      userId,
      tripInstanceId,
      null,
      null,
      null,
      null
    );
    const userTrip = await userTripsRepository.getUserTripsUsingQuery(query);
    if (userTrip && (userTrip.isJoined || userTrip.isRequested)) {
      throw new ValidationError(
        "User already part of trip or has already requested to join the trip",
        400
      );
    }
    await userTripsRepository.updateRequestTripForUser(
      userId,
      tripInstanceId,
      true
    );
    const notification = {
      notificationId: uuidv4(),
      senderId: userId,
      receiverId: hostId,
      tripInstanceId,
      event: NotificationEvents.USER_REQUEST_TO_JOIN,
    };
    notificationRepository.createNotification(notification);
  } catch (error) {
    logger.error(
      `Error occured while complete user request to join trip with tripInstanceId=${payload.tripInstanceId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function addMemberTrip(payload, userId) {
  try {
    const { tripInstanceId, memberId } = payload;
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    if (!memberId) {
      throw new ValidationError(
        `memberId Id not valid, memberId=${memberId}`,
        400
      );
    }
    const tripQuery = createQuery(
      null,
      null,
      userId,
      true,
      tripInstanceId,
      false
    );
    const tripInDatabase = await tripInstancesRepository.findTripsWithQuery(
      tripQuery,
      5,
      0
    );
    if (!tripInDatabase) {
      throw new ValidationError(
        "User not authorized to add member to a trip",
        400
      );
    }
    const query = createQueryForUserTrips(
      memberId,
      tripInstanceId,
      null,
      true,
      null,
      null
    );
    const userTrip = await userTripsRepository.getUserTripsUsingQuery(query);
    if (
      !userTrip ||
      userTrip.length == 0 ||
      !userTrip[0].isRequested ||
      userTrip[0].isJoined
    ) {
      throw new ValidationError(
        "User hasn't requested or has already joined",
        400
      );
    }

    const queryForUpdate = createQueryForUserTrips(
      null,
      null,
      true,
      false,
      null,
      null
    );

    await userTripsRepository.updateUserTripsUsingQuery(
      memberId,
      tripInstanceId,
      queryForUpdate
    );

    chatService.addMemberToChat(userId, memberId, tripInstanceId);

    const notification = {
      notificationId: uuidv4(),
      senderId: userId,
      receiverId: memberId,
      tripInstanceId,
      event: NotificationEvents.ADD_MEMBER_TO_TRIP,
    };
    notificationRepository.createNotification(notification);
  } catch (error) {
    logger.error(
      `Error occured while complete user request to join trip with tripInstanceId=${payload.tripInstanceId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function leaveTrip(payload, userId) {
  try {
    const { tripInstanceId, hostId } = payload;
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    const query = createQueryForUserTrips(
      userId,
      tripInstanceId,
      true,
      null,
      null,
      null
    );
    const userTrip = await userTripsRepository.getUserTripsUsingQuery(query);
    if (!userTrip) {
      throw new ValidationError("User hasn't joined yet", 400);
    }

    await userTripsRepository.updateJoinTripForUser(
      userId,
      tripInstanceId,
      false
    );

    const notification = {
      notificationId: uuidv4(),
      senderId: userId,
      receiverId: hostId,
      tripInstanceId: tripInstanceId,
      event: NotificationEvents.LEAVE_TRIP,
    };
    notificationRepository.createNotification(notification);
  } catch (error) {
    logger.error(
      `Error occured while complete user request to join trip with tripInstanceId=${payload.tripInstanceId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function getRequestedTrips(filter, userId) {
  try {
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    const {
      offset = 0,
      limit = parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10),
    } = filter;
    tripValidator.validateLimit(limit);

    const { skip, limitNumber, newOffset } = parseLimitAndOffset(
      limit,
      offset,
      parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
    );

    const requestedQuery = createQueryForUserTrips(
      userId,
      null,
      null,
      true,
      null,
      null
    );

    const fetchedTrips = await populateTripsUsingUserTripsQuery(
      requestedQuery,
      skip,
      limitNumber
    );

    logger.info(
      `Fetched requested trips with filter=${filter} for user with userId=${userId}, trips=${fetchedTrips}`
    );
    return { trips: fetchedTrips, newOffset };
  } catch (error) {
    logger.error(
      `failed to fetch requested trips for user with userId=${userId}, filter=${filter}, error=${error}`
    );
    throw error;
  }
}

async function getJoinedTrips(filter, userId) {
  try {
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }

    const {
      offset = 0,
      limit = parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10),
    } = filter;
    tripValidator.validateLimit(limit);

    const { skip, limitNumber, newOffset } = parseLimitAndOffset(
      limit,
      offset,
      parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
    );

    const joinedQuery = createQueryForUserTrips(
      userId,
      null,
      true,
      null,
      null,
      false
    );
    const fetchedTrips = await populateTripsUsingUserTripsQuery(
      joinedQuery,
      skip,
      limitNumber
    );

    logger.info(
      `Fetched joined trips with filter=${filter} for user with userId=${userId}, trips=${fetchedTrips}`
    );
    return { trips: fetchedTrips, newOffset };
  } catch (error) {
    logger.error(
      `failed to fetch joined trips for user with userId=${userId}, filter=${filter}, error=${error}`
    );
    throw error;
  }
}

async function getRequestedMembers(tripInstanceId) {
  try {
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    const query = createQueryForUserTrips(
      null,
      tripInstanceId,
      null,
      true,
      null,
      null
    );

    let pendingUsers = [];

    const pendingRequests = await userTripsRepository.getUserTripsUsingQuery(
      query
    );

    pendingRequests.forEach((userTrip) => {
      pendingUsers.push(userTrip.userId);
    });

    let trip = {};

    trip.requestingTripMembersIds = pendingUsers;

    await updateRequestedMembersProfilesInTrip(
      trip,
      USER_PROFILE_PROJECTION_IN_TRIP_DETAILS
    );

    logger.info(
      `fetched trip with tripInstanceId=${tripInstanceId}, trip=${trip}`
    );
    return trip;
  } catch (error) {
    logger.error(
      `Error while fetching trip with tripInstanceId=${tripInstanceId}, error=${error}`
    );
    throw error;
  }
}

async function removeMemberAsHost(payload, userId) {
  try {
    const { tripInstanceId, memberId } = payload;
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    if (!memberId) {
      throw new ValidationError(
        `memberId Id not valid, memberId=${memberId}`,
        400
      );
    }
    const tripQuery = createQuery(
      null,
      null,
      userId,
      true,
      tripInstanceId,
      false
    );
    const tripInDatabase = await tripInstancesRepository.findTripsWithQuery(
      tripQuery,
      5,
      0
    );

    if (tripInDatabase[0].hostId == memberId) {
      throw new ValidationError("Publisher can't be removed", 400);
    }

    if (tripInDatabase[0].hostId != userId) {
      throw new ValidationError(
        "User doesn't have the permission to remove the user",
        400
      );
    }

    const query = createQueryForUserTrips(
      memberId,
      tripInstanceId,
      true,
      null,
      null,
      null
    );
    const userTrips = await userTripsRepository.getUserTripsUsingQuery(query);
    if (!userTrips || userTrips.length == 0) {
      throw new ValidationError("User hasn't joined yet", 400);
    }
    await userTripsRepository.updateJoinTripForUser(
      memberId,
      tripInstanceId,
      false
    );
    const notification = {
      notificationId: uuidv4(),
      senderId: userId,
      receiverId: memberId,
      tripInstanceId: tripInstanceId,
      event: NotificationEvents.REMOVE_MEMBER_FROM_TRIP_AS_HOST,
    };
    notificationRepository.createNotification(notification);
  } catch (error) {
    logger.error(
      `Error occured while removing user=${payload.memberId} with tripInstanceId=${payload.tripInstanceId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function declineRequestInvitation(payload, userId) {
  try {
    const { tripInstanceId, memberId } = payload;
    if (!userId) {
      throw new ValidationError(`User Id not valid, userId=${userId}`, 400);
    }
    if (!tripInstanceId) {
      throw new ValidationError(
        `tripInstanceId Id not valid, tripInstanceId=${tripInstanceId}`,
        400
      );
    }
    if (!memberId) {
      throw new ValidationError(
        `memberId Id not valid, memberId=${memberId}`,
        400
      );
    }

    const tripQuery = createQuery(
      null,
      null,
      userId,
      true,
      tripInstanceId,
      false
    );
    const tripInDatabase = await tripInstancesRepository.findTripsWithQuery(
      tripQuery,
      5,
      0
    );

    if (!tripInDatabase || tripInDatabase[0].hostId != userId) {
      throw new ValidationError(
        "User not authorized to remove member from a trip",
        401
      );
    }
    await userTripsRepository.updateRequestTripForUser(
      memberId,
      tripInstanceId,
      false
    );
  } catch (error) {
    logger.error(
      `Error occured while declining invitation user=${payload.memberId} with tripInstanceId=${payload.tripInstanceId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function generatePreSignedUrl(payload, userId) {
  const { files, prefix, baseTripId } = payload;
  try {
    const tripInDatabase = await baseTripRepository.findTripWithTripId(
      baseTripId
    );
    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip with baseTripId=${baseTripId} not found`,
        400
      );
    }

    if (!tripInDatabase.hostId == userId) {
      throw new ValidationError(
        `User with userId=${userId} not authorized to generate presigned url for baseTripId=${baseTripId}`,
        403
      );
    }

    const signedUrls = await Promise.all(
      files.map(async ({ filename, filetype }) => {
        const key = `${prefix}/${filename}`;
        const params = {
          Bucket: process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES,
          Key: key,
          ContentType: filetype,
        };
        const s3Url = await generatePresignedUrlFromS3("putObject", params);
        return { s3Url, filename, filetype };
      })
    );
    return signedUrls;
  } catch (error) {
    logger.error(
      `Error occured while generating presigned url for files=${JSON.stringify(
        files
      )} with prefix=${prefix}, error=${error}`
    );
    throw error;
  }
}

module.exports = {
  createTrip,
  getTripById,
  getTripsWithFilter,
  editTrip,
  deleteBaseTrip,
  deleteTripInstance,
  getTripsByUser,
  getWishlistedTrips,
  addWishlistTrip,
  removeWishlistedTrip,
  requestJoinTrip,
  addMemberTrip,
  leaveTrip,
  getRequestedTrips,
  getJoinedTrips,
  getRequestedMembers,
  removeMemberAsHost,
  createTripsImages,
  declineRequestInvitation,
  getRandomTrips,
  generatePreSignedUrl,
};
