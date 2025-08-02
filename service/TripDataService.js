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
  try {
    logger.debug(`Adding joined members profiles to trip: tripInstanceId=${trip?.tripInstanceId}`);

    trip.joinedMembers = await userProfileRepository.findUsersByUserId(
      trip.tripMembersIds
    );

    logger.debug(`Successfully added ${trip.joinedMembers?.length || 0} joined members to trip: tripInstanceId=${trip?.tripInstanceId}`);
  } catch (error) {
    logger.error(`Failed to add joined members profiles to trip: tripInstanceId=${trip?.tripInstanceId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function addRequestedMembersProfilesToTrip(trip, projection) {
  try {
    logger.debug(`Adding requested members profiles to trip: tripInstanceId=${trip?.tripInstanceId}`);

    trip.requestingMembers = await userProfileRepository.findUsersByUserId(
      trip.requestingTripMembersIds
    );

    logger.debug(`Successfully added ${trip.requestingMembers?.length || 0} requested members to trip: tripInstanceId=${trip?.tripInstanceId}`);
  } catch (error) {
    logger.error(`Failed to add requested members profiles to trip: tripInstanceId=${trip?.tripInstanceId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function updateMemberProfiles(members) {
  try {
    logger.debug(`Updating ${members?.length || 0} member profiles`);

    const updatedMembers = await Promise.all(
      members.map(async (originalMember, index) => {
        logger.debug(`Processing member ${index + 1}/${members.length}: userId=${originalMember?.userId}`);

        let member = originalMember;
        member.profilePic = await getObjectsFromS3Bucket(
          "",
          member.profilePic,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
        );

        logger.debug(`Successfully updated member profile: userId=${member?.userId}`);
        return member;
      })
    );

    logger.debug(`Successfully updated ${updatedMembers.length} member profiles`);
    return updatedMembers;
  } catch (error) {
    logger.error(`Failed to update member profiles: members count=${members?.length || 0}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function updateJoinedMembersProfilesInTrip(trip, projection) {
  try {
    logger.debug(`Updating joined members profiles in trip: tripInstanceId=${trip?.tripInstanceId}`);

    await addJoinedMembersProfilesToTrip(trip, projection);
    const [updatedJoinedMembers] = await Promise.all([
      updateMemberProfiles(trip.joinedMembers),
    ]);
    trip.joinedMembers = updatedJoinedMembers;

    logger.debug(`Successfully updated joined members profiles in trip: tripInstanceId=${trip?.tripInstanceId}`);
  } catch (error) {
    logger.error(`Failed to update joined members profiles in trip: tripInstanceId=${trip?.tripInstanceId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function updateRequestedMembersProfilesInTrip(trip, projection) {
  try {
    logger.debug(`Updating requested members profiles in trip: tripInstanceId=${trip?.tripInstanceId}`);

    await addRequestedMembersProfilesToTrip(trip, projection);
    const [updatedRequestedMembers] = await Promise.all([
      updateMemberProfiles(trip.requestingMembers),
    ]);
    trip.requestingMembers = updatedRequestedMembers;

    logger.debug(`Successfully updated requested members profiles in trip: tripInstanceId=${trip?.tripInstanceId}`);
  } catch (error) {
    logger.error(`Failed to update requested members profiles in trip: tripInstanceId=${trip?.tripInstanceId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getRelatedDatesToBaseTrip(fetchedTrips) {
  try {
    logger.info(`Getting related dates for ${fetchedTrips?.length || 0} base trips`);

    const tripsWithRelatedDates = await Promise.all(
      fetchedTrips.map(async (trip, index) => {
        logger.debug(`Processing base trip ${index + 1}/${fetchedTrips.length}: baseTripId=${trip?.baseTripId}`);

        const baseTripId = trip.baseTripId;
        const tripInstances = await tripInstancesRepository.getTripsByBaseTripId(
          baseTripId
        );

        logger.debug(`Found ${tripInstances?.length || 0} trip instances for baseTripId=${baseTripId}`);

        trip.relatedTrips = tripInstances.map((tripInstance) => {
          const startDate = tripInstance.startDate;
          const endDate = tripInstance.endDate;
          const tripInstanceId = tripInstance.tripInstanceId;
          return { startDate, endDate, tripInstanceId };
        });

        logger.debug(`Successfully processed base trip: baseTripId=${baseTripId}, relatedTrips count=${trip.relatedTrips?.length || 0}`);
        return trip;
      })
    );

    logger.info(`Successfully got related dates for ${tripsWithRelatedDates.length} base trips`);
    return tripsWithRelatedDates;
  } catch (error) {
    logger.error(`Failed to get related dates for base trips: trips count=${fetchedTrips?.length || 0}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function populateTripsUsingUserTripsQuery(query, skip, limitNumber) {
  try {
    logger.info(`Populating trips using user trips query: skip=${skip}, limitNumber=${limitNumber}`);

    logger.debug(`Fetching user trips from database`);
    const userTrips = await userTripsRepository.getUserTripsUsingQuery(
      query,
      skip,
      limitNumber
    );

    if (!userTrips || userTrips.length === 0) {
      logger.info(`No user trips found for query`);
      return [];
    }

    logger.info(`Found ${userTrips.length} user trips`);
    const fetchedUserTrips = userTrips;

    var fetchedUserTripsIds = [];

    fetchedUserTrips.forEach((fetchedUserTrip) => {
      fetchedUserTripsIds.push(fetchedUserTrip.tripInstanceId);
    });

    logger.debug(`Fetching trip instances for ${fetchedUserTripsIds.length} trip instance IDs`);
    const fetchedTrips =
      await tripInstancesRepository.findTripsWithQueryUsingAggregation(
        {
          tripInstanceId: { $in: fetchedUserTripsIds },
        },
        limitNumber,
        skip,
        {}
      );

    logger.info(`Found ${fetchedTrips?.length || 0} trip instances`);
    let fetchedTripsObj = fetchedTrips;

    logger.debug(`Adding cropped destination images to trips`);
    fetchedTripsObj = await addCroppedDestinationImagesToTrips(
      fetchedTripsObj,
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES
    );

    logger.debug(`Updating joined members profiles for ${fetchedTripsObj.length} trips`);
    await Promise.all(
      fetchedTripsObj.map(async (trip, index) => {
        logger.debug(`Processing trip ${index + 1}/${fetchedTripsObj.length}: tripInstanceId=${trip?.tripInstanceId}`);
        await updateJoinedMembersProfilesInTrip(
          trip,
          USER_PROFILE_PROJECTION_IN_SEARCH_CARD
        );
      })
    );

    logger.info(`Successfully populated ${fetchedTripsObj.length} trips using user trips query`);
    return fetchedTripsObj;
  } catch (error) {
    logger.error(`Failed to populate trips using user trips query: skip=${skip}, limitNumber=${limitNumber}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

function addDestinationToQuery(query, destination) {
  if (destination) {
    logger.debug(`Adding destination to query: destination=${destination}`);
    query.destination = { $in: [destination] };
  }
}

function addPersonaToQuery(query, persona) {
  if (persona) {
    logger.debug(`Adding persona to query: persona=${persona}`);
    query.persona = persona;
  }
}

function addDateToQuery(query, queryDate, fetchPastTrips) {
  if (queryDate) {
    if (!isNaN(queryDate)) {
      logger.debug(`Adding date to query: queryDate=${queryDate}`);
      const queryStartDate = new Date(queryDate);
      const queryEndDate = queryDate.setUTCHours(23, 59, 59, 999);
      query.startDate = { $gte: queryStartDate, $lt: queryDate };
    } else {
      logger.error(`Invalid date passed in query: queryDate=${queryDate}`);
      throw new ValidationError("Invalid Date Passed");
    }
  } else if (!fetchPastTrips) {
    logger.debug(`Adding today's date filter to query (excluding past trips)`);
    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);
    query.startDate = { $gte: todayDate };
  }
}

function excludeUserIdFromQuery(query, userId) {
  if (userId) {
    logger.debug(`Excluding userId from query: userId=${userId}`);
    query.hostId = { $ne: userId };
  }
}

function addUserIdToQuery(query, userId) {
  if (userId) {
    logger.debug(`Adding userId to query: userId=${userId}`);
    query.hostId = userId;
  }
}

function addTripInstanceIdToQuery(query, tripInstanceId) {
  if (tripInstanceId) {
    logger.debug(`Adding tripInstanceId to query: tripInstanceId=${tripInstanceId}`);
    query.tripInstanceId = tripInstanceId;
  }
}

function addBaseTripIdToQuery(query, baseTripId) {
  if (baseTripId) {
    logger.debug(`Adding baseTripId to query: baseTripId=${baseTripId}`);
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
  logger.debug(`Creating query: destination=${destination}, date=${date}, userId=${userId}, includeUser=${includeUser}, tripInstanceId=${tripInstanceId}, fetchPastTrips=${fetchPastTrips}, startLocation=${startLocation}`);

  let query = {};
  addDestinationToQuery(query, destination);
  addStartLocationToQuery(query, startLocation);
  addDateToQuery(query, date, fetchPastTrips);
  includeUser
    ? addUserIdToQuery(query, userId)
    : excludeUserIdFromQuery(query, userId);
  addTripInstanceIdToQuery(query, tripInstanceId);

  logger.debug(`Created query: ${JSON.stringify(query)}`);
  return query;
}

function createAdditionalFilters(filter) {
  logger.debug(`Creating additional filters: filter=${JSON.stringify(filter)}`);

  let query = {};
  addPersonaToQuery(query, filter.persona);

  logger.debug(`Created additional filters: ${JSON.stringify(query)}`);
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
  logger.debug(`Creating query for base trips: destination=${destination}, date=${date}, userId=${userId}, includeUser=${includeUser}, baseTripId=${baseTripId}, startLocation=${startLocation}`);

  let query = {};
  addDestinationToQuery(query, destination);
  addStartLocationToQuery(query, startLocation);
  addDateToQuery(query, date, true);
  includeUser
    ? addUserIdToQuery(query, userId)
    : excludeUserIdFromQuery(query, userId);
  addBaseTripIdToQuery(query, baseTripId);

  logger.debug(`Created base trips query: ${JSON.stringify(query)}`);
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
  logger.debug(`Creating query for user trips: userId=${userId}, tripInstanceId=${tripInstanceId}, isJoined=${isJoined}, isRequested=${isRequested}, isWishlisted=${isWishlisted}, isPublished=${isPublished}`);

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

  logger.debug(`Created user trips query: ${JSON.stringify(query)}`);
  return query;
}

async function getTripsUsingQueryWithLimitAndOffset(
  query,
  limit,
  offset,
  additionalFilters
) {
  try {
    logger.info(`Getting trips using query with limit and offset: limit=${limit}, offset=${offset}`);

    const { skip, limitNumber, newOffset } = parseLimitAndOffset(
      limit,
      offset,
      parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
    );

    logger.debug(`Parsed pagination: skip=${skip}, limitNumber=${limitNumber}, newOffset=${newOffset}`);

    const trips = await baseTripRepository.findTripsWithQueryUsingAggregation(
      query,
      limitNumber,
      skip,
      additionalFilters
    );

    logger.info(`Successfully retrieved ${trips?.length || 0} trips`);
    return { trips, newOffset };
  } catch (error) {
    logger.error(`Failed to get trips using query: limit=${limit}, offset=${offset}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getTripInstancesUsingQueryWithLimitAndOffset(
  query,
  limit,
  offset,
  additionalFilters
) {
  try {
    logger.info(`Getting trip instances using query with limit and offset: limit=${limit}, offset=${offset}`);

    const { skip, limitNumber, newOffset } = parseLimitAndOffset(
      limit,
      offset,
      parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
    );

    logger.debug(`Parsed pagination: skip=${skip}, limitNumber=${limitNumber}, newOffset=${newOffset}`);

    const trips =
      await tripInstancesRepository.findTripsWithQueryUsingAggregation(
        query,
        limitNumber,
        skip,
        additionalFilters
      );

    logger.info(`Successfully retrieved ${trips?.length || 0} trip instances`);
    return { trips, newOffset };
  } catch (error) {
    logger.error(`Failed to get trip instances using query: limit=${limit}, offset=${offset}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function addCroppedDestinationImagesToTrips(trips, path) {
  try {
    logger.info(`Adding cropped destination images to ${trips?.length || 0} trips`);

    const tripsWithImages = await Promise.all(
      trips.map(async (trip, index) => {
        logger.debug(`Processing trip ${index + 1}/${trips.length}: tripInstanceId=${trip?.tripInstanceId}`);

        const res = await getObjectsFromS3Bucket(
          path,
          trip.croppedDestinationImages,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );
        trip.croppedDestinationImages = res;

        logger.debug(`Successfully added cropped destination images to trip: tripInstanceId=${trip?.tripInstanceId}`);
        return trip;
      })
    );

    logger.info(`Successfully added cropped destination images to ${tripsWithImages.length} trips`);
    return tripsWithImages;
  } catch (error) {
    logger.error(`Failed to add cropped destination images to trips: trips count=${trips?.length || 0}, path=${path}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function createTrip(payload, userId) {
  try {
    logger.info(`Creating trip for userId=${userId}`);

    const baseTripId = uuidv4();
    logger.debug(`Generated baseTripId=${baseTripId} for userId=${userId}`);

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
    };

    logger.info(`Creating base trip in database: baseTripId=${baseTripId}, title=${payload.title}`);
    const createdBaseTrip = await baseTripRepository.createTrip(baseTrip);
    logger.info(`Successfully created base trip: baseTripId=${baseTripId}`);

    const { tripDates: strTripDates } = payload;
    const tripDates = Array.from(strTripDates);
    logger.debug(`Processing ${tripDates.length} trip dates for baseTripId=${baseTripId}`);

    const tripInstances = tripDates.map((tripDate, index) => {
      logger.debug(`Processing trip date ${index + 1}/${tripDates.length}: startDate=${tripDate.startDate}, endDate=${tripDate.endDate}`);

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
      };

      logger.debug(`Created trip instance: tripInstanceId=${tripInstanceId}, baseTripId=${baseTripId}`);
      return tripInstance;
    });

    logger.info(`Creating ${tripInstances.length} trip instances in database`);
    const createdTripInstances = await tripInstancesRepository.createInstances(
      tripInstances
    );
    logger.info(`Successfully created ${createdTripInstances.length} trip instances`);

    logger.info(`Updating user trips for ${tripInstances.length} trip instances`);
    await Promise.all(
      tripInstances.map(async (tripInstance, index) => {
        logger.debug(`Updating user trip ${index + 1}/${tripInstances.length}: tripInstanceId=${tripInstance.tripInstanceId}`);
        await userTripsRepository.updateUserTripsUsingQuery(
          userId,
          tripInstance.tripInstanceId,
          {
            isJoined: true,
            isPublished: true,
            isRequested: false,
            isWishlisted: false
          }
        );
      })
    );
    logger.info(`Successfully updated user trips for all trip instances`);

    logger.info(`Creating chat for trip: baseTripId=${baseTripId}, title=${payload.title}`);
    chatService.createChat(tripInstances, userId, payload.title);
    logger.info(`Successfully created chat for trip: baseTripId=${baseTripId}`);

    logger.info(`Successfully completed trip creation: baseTripId=${baseTripId}, userId=${userId}`);
    return baseTripId;
  } catch (error) {
    logger.error(`Failed to create trip: userId=${userId}, title=${payload?.title}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getTripById(tripInstanceId, userId) {
  try {
    logger.info(`Getting trip by ID: tripInstanceId=${tripInstanceId}, userId=${userId}`);

    logger.debug(`Fetching trip from database: tripInstanceId=${tripInstanceId}`);
    let trip = await tripInstancesRepository.findTripWithTripId(tripInstanceId);
    if (!trip || trip.length == 0) {
      logger.warn(`Trip not found: tripInstanceId=${tripInstanceId}`);
      throw new ValidationError(
        `Trip not found for tripInstanceId=${tripInstanceId}`,
        400
      );
    }

    logger.info(`Found trip: tripInstanceId=${tripInstanceId}`);
    let fetchedTrip = trip[0];

    logger.debug(`Fetching destination images from S3 for tripInstanceId=${tripInstanceId}`);
    fetchedTrip.destinationImages = await getObjectsFromS3Bucket(
      process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
      fetchedTrip.destinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );
    logger.debug(`Successfully fetched destination images for tripInstanceId=${tripInstanceId}`);

    logger.debug(`Creating query for joined trips: tripInstanceId=${tripInstanceId}`);
    const query = createQueryForUserTrips(
      null,
      tripInstanceId,
      true,
      null,
      null,
      null
    );

    logger.debug(`Fetching joined trips from database: tripInstanceId=${tripInstanceId}`);
    const joinedTrips = await userTripsRepository.getUserTripsUsingQuery(query);

    let joinedUsers = [];

    joinedTrips.forEach((userTrip) => {
      joinedUsers.push(userTrip.userId);
    });
    logger.debug(`Found ${joinedUsers.length} joined users for tripInstanceId=${tripInstanceId}`);

    fetchedTrip.isJoined = false;
    fetchedTrip.isWishlisted = false;
    fetchedTrip.isRequested = false;

    if (userId) {
      logger.debug(`Checking user trip status for userId=${userId}, tripInstanceId=${tripInstanceId}`);
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
        logger.debug(`Updated trip status for userId=${userId}: isJoined=${fetchedTrip.isJoined}, isWishlisted=${fetchedTrip.isWishlisted}, isRequested=${fetchedTrip.isRequested}`);
      } else {
        logger.debug(`No user trip status found for userId=${userId}, tripInstanceId=${tripInstanceId}`);
      }
    }

    fetchedTrip.tripMembersIds = joinedUsers;

    logger.debug(`Updating joined members profiles for tripInstanceId=${tripInstanceId}`);
    await updateJoinedMembersProfilesInTrip(
      fetchedTrip,
      USER_PROFILE_PROJECTION_IN_TRIP_DETAILS
    );

    logger.debug(`Getting related dates for tripInstanceId=${tripInstanceId}`);
    fetchedTrip = await getRelatedDatesToBaseTrip(Array.of(fetchedTrip));

    logger.info(`Successfully retrieved trip: tripInstanceId=${tripInstanceId}, destination=${fetchedTrip.destination}, joinedMembers=${joinedUsers.length}`);
    return fetchedTrip;
  } catch (error) {
    logger.error(`Failed to get trip by ID: tripInstanceId=${tripInstanceId}, userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
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

    deleteObjectsFromS3Bucket(
      process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
      newPayload.removedDestinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    deleteObjectsFromS3Bucket(
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
      newPayload.removedCroppedDestinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    Object.entries(newPayload).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        key != "__v" &&
        key != "_id" &&
        key != "createdAt" &&
        key != "hostId"
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
    if (filter.date) {
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

    chatService.addMemberToChat(memberId, tripInstanceId);

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
