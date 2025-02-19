const logger = require("../logger");
const tripRepository = require("../repositories/TripRepository.js");
const userTripsRepository = require("../repositories/UserTripsRepository.js");
const userProfileRepository = require("../repositories/UserProfileRepository.js");
const notificationRepository = require("../repositories/NotificationRepository.js");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
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
const NotificationEvents = require("../enums/notificationEvents.js");

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
    members.map(async (member) => {
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

async function populateTripsUsingUserTripsQuery(query, skip, limitNumber) {
  const userTrips = await userTripsRepository.getUserTripsUsingQuery(
    query,
    skip,
    limitNumber
  );

  if (!userTrips || userTrips.length === 0) {
    throw new ValidationError(
      `No requested trips found with the query=${query}`,
      404
    );
  }

  const fetchedUserTrips = userTrips.map((trip) => trip.toObject());

  let fetchedUserTripsIds = [];
  let joinedUsers = [];
  fetchedUserTrips.forEach((fetchedUserTrip) => {
    fetchedUserTripsIds.push(fetchedUserTrip.tripId);
    joinedUsers.push(fetchedUserTrip.userId);
  });



  const fetchedTrips = await tripRepository.findTripsWithQuery({
    tripId: { $in: fetchedUserTripsIds },
  });
  fetchedTrips.tripMembersIds = await addCroppedDestinationImagesToTrips(
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
  return fetchedTrips;
}

function addDestinationToQuery(query, destination) {
  if (destination) {
    query.destination = destination;
  }
}

function addDateToQuery(query, queryDate) {
  if (queryDate) {
    if (!isNaN(queryDate)) {
      query.startDate = { $lte: queryDate };
      query.endDate = { $gte: queryDate };
    } else {
      logger.error("Invalid date passed in query");
      throw new ValidationError("Invalid Date Passed");
    }
  }
}

function excludeUserIdFromQuery(query, userId) {
  if (userId) {
    query.userId = { $ne: userId };
  }
}

function addUserIdToQuery(query, userId) {
  if (userId) {
    query.userId = userId;
  }
}

function createQuery(destination, date, userId, includeUser) {
  let query = {};
  addDestinationToQuery(query, destination);
  addDateToQuery(query, date);
  includeUser
    ? addUserIdToQuery(query, userId)
    : excludeUserIdFromQuery(query, userId);
  return query;
}

function createQueryForUserTrips(
  userId,
  tripId,
  isJoined,
  isRequested,
  isWishlisted
) {
  let query = {};
  if (userId) {
    query.userId = userId;
  }
  if (tripId) {
    query.tripId = tripId;
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
  return query;
}

async function getTripsUsingQueryWithLimitAndOffset(query, limit, offset) {
  const { skip, limitNumber, newOffset } = parseLimitAndOffset(
    limit,
    offset,
    parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10)
  );

  const trips = await tripRepository.findTripsWithQuery(
    query,
    limitNumber,
    skip
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

async function createTrip(payload, files, userId) {
  try {
    const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!user) {
      logger.info(`User not found with userId=${userId}`);
      throw new ValidationError("User not found", 404);
    }

    let tripIds = [];

    const { tripDates } = payload;
    tripDates?.forEach(async (tripDate) => {
      if(files){
        files?.forEach((file) => {
          file.originalname = randomFileName(file.originalname);
        });
      }
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(
          process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
          files,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );
  
      files = await cropAndResizeImages(files);
  
      const { uploadedObjectNames: croppedDestinationImages } =
        await uploadObjectsToS3Bucket(
          process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
          files,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );
  
      const destinationImages = uploadedObjectNames;
      const { startDate, endDate } = tripDate;
      const queryStartDate = dateFromDateString(startDate);
      const queryEndDate = dateFromDateString(endDate);
      payload.startDate = queryStartDate;
      payload.endDate = queryEndDate;
      tripValidator.validateTripPayload(payload);

      const tripId = uuidv4();
      tripIds.push(tripId);

      const newTrip = {
        ...payload,
        destinationImages,
        croppedDestinationImages,
        userId,
        tripId,
      };

      const createdTrip = await tripRepository.createTrip(newTrip);
      logger.info(
        `Trip with payload=${JSON.stringify(
          payload
        )}, tripId=${tripId} created successfully`
      );
    });

    return tripIds;
  } catch (error) {
    logger.error(
      `Error creating trip with payload=${JSON.stringify(
        payload
      )}, error=${error}`
    );
    throw error;
  }
}

async function getTripById(tripId, userId) {
  try {
    let trip = await tripRepository.findTripWithTripId(tripId);
    if (!trip) {
      throw new ValidationError(`Trip not found for tripId=${tripId}`, 404);
    }
    const fetchedTrip = trip.toObject();
    fetchedTrip.destinationImages = await getObjectsFromS3Bucket(
      process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
      trip.destinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    const query = createQueryForUserTrips(null, tripId, true, null, null);

    const joinedTrips = await userTripsRepository.getUserTripsUsingQuery(query);

    let joinedUsers = [];

    joinedTrips.forEach((userTrip) => {
      joinedUsers.push(userTrip.userId);
    });



    fetchedTrip.tripMembersIds = joinedUsers;

    const wishlistedQuery = createQueryForUserTrips(
      userId,
      tripId,
      null,
      null,
      true
    );
    const wishlistedTrips = await userTripsRepository.getUserTripsUsingQuery(
      wishlistedQuery
    );
    fetchedTrip.isWishlisted = wishlistedTrips != 0;

    await updateJoinedMembersProfilesInTrip(
      fetchedTrip,
      USER_PROFILE_PROJECTION_IN_TRIP_DETAILS
    );

    logger.info(`fetched trip with tripId=${tripId}, trip=${trip}`);
    return fetchedTrip;
  } catch (error) {
    logger.error(
      `Error while fetching trip with tripId=${tripId}, error=${error}`
    );
    throw error;
  }
}

async function editTrip(tripId, userId, newPayload, newDestinationImages) {
  try {
    const tripInDatabase = await tripRepository.findTripWithTripId(tripId);
    if (!tripInDatabase) {
      throw new ValidationError(`Trip with tripId=${tripId} not found`, 404);
    }

    if (!tripInDatabase.userId == userId) {
      throw new ValidationError(
        `User with userId=${userId} not authorized to edit trip with tripId=${tripId}`,
        403
      );
    }

  
    const queryStartDate = dateFromDateString(newPayload.startDate);
    const queryEndDate = dateFromDateString(newPayload.endDate);

    newPayload.startDate = queryStartDate;
    newPayload.endDate = queryEndDate;
    tripValidator.validateTripPayload(newPayload);

    Object.entries(newPayload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        tripInDatabase[key] = value;
      }
    });

    var allFilesUploaded = true;
    let uploadedDestinationImages = tripInDatabase.destinationImages;
    let uploadedCroppedImagesNames = tripInDatabase.croppedDestinationImages;
    const removedImages = newPayload.removedDestinationImages;

    uploadedDestinationImages = uploadedDestinationImages.filter(
      (image) => !removedImages.includes(image)
    );
    uploadedCroppedImagesNames = uploadedCroppedImagesNames.filter(
      (image) => !removedImages.includes(image)
    );
    if (newDestinationImages && newDestinationImages.length > 0) {
      newDestinationImages.forEach((newDestinationImage) => {
        newDestinationImage.originalname = randomFileName(
          newDestinationImage.originalname
        );
      });
  
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(
          process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
          newDestinationImages,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );

      newDestinationImages = await cropAndResizeImages(newDestinationImages);

      const {
        uploadedObjectNames: croppedImagesNames,
        allObjectsUploaded: allCroppedImagesUploaded,
      } = await uploadObjectsToS3Bucket(
        process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
        newDestinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );

      deleteObjectsFromS3Bucket(
        process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
        newPayload.removedDestinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );

      deleteObjectsFromS3Bucket(
        process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
        newPayload.removedDestinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );

      uploadedDestinationImages.push(...uploadedObjectNames);
      uploadedCroppedImagesNames.push(...croppedImagesNames);
      allFilesUploaded = allObjectsUploaded && allCroppedImagesUploaded;
    }

    tripInDatabase.destinationImages = uploadedDestinationImages;
    tripInDatabase.croppedDestinationImages = uploadedCroppedImagesNames;

    const updatedTrip = await tripRepository.updateTrip(tripInDatabase);
    logger.info(`Trip with tripId=${tripId} updated successfully`);

    return { updatedTrip, allFilesUploaded };
  } catch (error) {
    logger.error(
      `Error editing trip with newPayload=${JSON.stringify(
        newPayload
      )}, error=${error}`
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

    const query = createQuery(null, null, userId, true);
    var { trips, newOffset } = await getTripsUsingQueryWithLimitAndOffset(
      query,
      limit,
      offset
    );

    if (trips.length === 0) {
      throw new ValidationError(
        `No trips found with the filter=${filter}, query=${query}`,
        404
      );
    }

    const fetchedTrips = trips.map((trip) => trip.toObject());

    fetchedTrips = await Promise.all(
      fetchedTrips.map(async (trip) => {
        const userTripsQuery = createQueryForUserTrips(
          null,
          trip.tripId,
          true,
          false,
          false
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

    logger.info(
      `Fetched trips with filter=${filter} for user with userId=${userId}, trips=${trips}`
    );
    return { trips: fetchedTrips, newOffset };
  } catch (error) {
    logger.error(
      `failed to fetch trips for user with userId=${userId}, filter=${filter}, error=${error}`
    );
    throw error;
  }
}

async function getTripsWithFilter(filter, userId) {
  try {
    const {
      destination,
      offset = 0,
      limit = parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10),
    } = filter;

    filter.date = dateFromDateString(filter.date);
    tripValidator.validateFilter(filter);
    let { date } = filter;
    const query = createQuery(destination, date, userId, false);
    var { trips, newOffset } = await getTripsUsingQueryWithLimitAndOffset(
      query,
      limit,
      offset
    );

    if (trips.length === 0) {
      throw new ValidationError(
        `No trips found with the filter=${filter}, query=${query}`,
        404
      );
    }

    const fetchedTrips = trips.map((trip) => trip.toObject());

    fetchedTrips = await Promise.all(
      fetchedTrips.map(async (trip) => {
        const userTripsQuery = createQueryForUserTrips(
          null,
          trip.tripId,
          true,
          false,
          false
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
    logger.error(`failed to fetch trips with filter=${filter}, error=${error}`);
    throw error;
  }
}

async function deleteTrip(tripId, userId) {
  try {
    const tripInDatabase = await tripRepository.findTripWithTripIdAndUserId(
      tripId,
      userId
    );

    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip not found or user doesn't have permssion to delete trip with tripId=${tripId}, userId=${userId}`,
        404
      );
    }
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

    await tripRepository.deleteTripsByTripId(tripId);
    logger.info(`Trip with tripId=${tripId} deleted successfully`);
  } catch (error) {
    logger.error(`Error deleting trip with tripId=${tripId}, error=${error}`);
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
      true
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

async function addWishlistTrip(tripId, userId) {
  try {
    const addedTrip = await userTripsRepository.updateWishlistTripForUser(
      userId,
      tripId,
      true
    );
    logger.info(
      `added tripId=${tripId} to wishlisted trips for user with userId=${userId} with result=${addedTrip}`
    );
  } catch (error) {
    logger.error(
      `failed to add tripId=${tripId} to wishlisted trips for user with userId=${userId}`
    );
    throw error;
  }
}

async function removeWishlistedTrip(tripId, userId) {
  try {
    const trip = await userTripsRepository.updateWishlistTripForUser(
      userId,
      tripId,
      false
    );
    logger.info(
      `removed tripId=${tripId} from wishlisted trips for user with userId=${userId} with result=${trip}`
    );
  } catch (error) {
    logger.error(
      `failed to remove tripId=${tripId} from wishlisted trips for user with userId=${userId}`
    );
    throw error;
  }
}

async function requestJoinTrip(payload, userId) {
  try {
    const { tripId } = payload;
    const query = createQueryForUserTrips(userId, tripId, null, null, null);
    const userTrip = await userTripsRepository.getUserTripsUsingQuery(query);
    if (userTrip && (userTrip.isJoined || userTrip.isRequested)) {
      throw new ValidationError(
        "User already part of trip or has already requested to join the trip",
        400
      );
    }
    await userTripsRepository.updateRequestTripForUser(userId, tripId, true);
    tripRepository.findTripWithTripId(tripId).then(async (trip)=>{
      const notification = {
        notificationId: uuidv4(),
        senderId: userId,
        receiverId: trip.userId,
        tripId: tripId,
        event: NotificationEvents.USER_REQUEST_TO_JOIN
      }
      notificationRepository.createNotification(notification);
    })
  } catch (error) {
    logger.error(
      `Error occured while complete user request to join trip with tripId=${payload.tripId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function addMemberTrip(payload, userId) {
  try {
    const { tripId, memberId } = payload;
    const tripInDatabase = await tripRepository.findTripWithTripIdAndUserId(
      tripId,
      userId
    );
    if (!tripInDatabase) {
      throw new ValidationError(
        "User not authorized to add member to a trip",
        400
      );
    }
    const query = createQueryForUserTrips(memberId, tripId, null, null, null);
    const userTrip = await userTripsRepository.getUserTripsUsingQuery(query);
    if (!userTrip || !userTrip.isRequested ||  userTrip.isJoined) {
      throw new ValidationError("User hasn't requested or has already joined", 400);
    }

    await userTripsRepository.updateJoinTripForUser(memberId, tripId, true);
    const notification = {
      notificationId: uuidv4(),
      senderId: userId,
      receiverId: memberId,
      tripId,
      event: NotificationEvents.ADD_MEMBER_TO_TRIP
    }
    notificationRepository.createNotification(notification);
  } catch (error) {
    logger.error(
      `Error occured while complete user request to join trip with tripId=${payload.tripId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function leaveTrip(payload, userId) {
  try {
    const { tripId } = payload;
    const query = createQueryForUserTrips(userId, tripId, false, null, null);
    const userTrip = await userTripsRepository.getUserTripsUsingQuery(query);
    if (!userTrip) {
      throw new ValidationError("User hasn't joined yet", 400);
    }

    await userTripsRepository.updateJoinTripForUser(userId, tripId, false);
    tripRepository.findTripWithTripId(tripId).then(async (trip)=>{
      const notification = {
        notificationId: uuidv4(),
        senderId: userId,
        receiverId: trip.userId,
        tripId: tripId,
        event: NotificationEvents.LEAVE_TRIP
      }
      notificationRepository.createNotification(notification);
    })
    
  } catch (error) {
    logger.error(
      `Error occured while complete user request to join trip with tripId=${payload.tripId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function getRequestedTrips(filter, userId) {
  try {
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

    const joinedQuery = createQueryForUserTrips(userId, null, true, null, null);
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

async function getRequestedMembers(tripId) {
  try {
    const query = createQueryForUserTrips(null, tripId, null, true, null);

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

    logger.info(`fetched trip with tripId=${tripId}, trip=${trip}`);
    return trip;
  } catch (error) {
    logger.error(
      `Error while fetching trip with tripId=${tripId}, error=${error}`
    );
    throw error;
  }
}

async function removeMemberAsHost(payload, userId) {
  try {
    const { tripId, memberId } = payload;
    const tripInDatabase = await tripRepository.findTripWithTripIdAndUserId(
      tripId,
      userId
    );

    if (!tripInDatabase || tripInDatabase.userId != userId) {
      throw new ValidationError(
        "User not authorized to remove member from a trip",
        401
      );
    }

    const query = createQueryForUserTrips(memberId, tripId, true, null, null);
    const userTrips = await userTripsRepository.getUserTripsUsingQuery(query);
    if (!userTrips || userTrips.length == 0) {
      throw new ValidationError("User hasn't joined yet", 400);
    }
    await userTripsRepository.updateJoinTripForUser(userId, tripId, false);
    const notification = {
      notificationId: uuidv4(),
      senderId: userId,
      receiverId: memberId,
      tripId: tripId,
      event: NotificationEvents.REMOVE_MEMBER_FROM_TRIP_AS_HOST
    }
    notificationRepository.createNotification(notification);
  } catch (error) {
    logger.error(
      `Error occured while removing user=${payload.memberId} with tripId=${payload.tripId}, userId=${userId}, error=${error}`
    );
    throw error;
  }
}

module.exports = {
  createTrip,
  getTripById,
  getTripsWithFilter,
  editTrip,
  deleteTrip,
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
};
