const logger = require("../Logger");
const tripRepository = require("../repositories/TripRepository.js");
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
  includeUser ? addUserIdToQuery : excludeUserIdFromQuery(query, userId);
  return query;
}

async function getTripsUsingQueryWithLimitAndOffset(query, limit, offset) {
  const { skip, limitNumber, newOffset } = parseLimitAndOffset(
    limit,
    offset,
    process.env.LIMIT_FOR_SENDING_TRIPS
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
      trip.croppedDestinationImages = await getObjectsFromS3Bucket(
        path,
        trip.croppedDestinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );
      return trip;
    })
  );

  return trips;
}

async function createTrip(payload, files, user) {
  try {
    const userId = user.userId;
    const { uploadedObjectNames, allObjectsUploaded } =
      await uploadObjectsToS3Bucket(
        process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
        files,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );

    files = await cropAndResizeImages(files);

    const { uploadedObjectNames: croppedDestinationImages } = await uploadObjectsToS3Bucket(
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
      files,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    const destinationImages = uploadedObjectNames;

    const { startDate, endDate } = payload;

    const queryStartDate = dateFromDateString(startDate);
    const queryEndDate = dateFromDateString(endDate);
    payload.startDate = queryStartDate;
    payload.endDate = queryEndDate;
    payload.tripMembers = [user];
    tripValidator.validateTripPayload(payload);

    const tripId = uuidv4();

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
    return { createdTrip, allObjectsUploaded };
  } catch (error) {
    logger.error(
      `Error creating trip with payload=${JSON.stringify(
        payload
      )}, error=${error}`
    );
    throw error;
  }
}

async function getTripById(tripId) {
  try {
    const trip = await tripRepository.findTripWithTripId(tripId);
    if (!trip) {
      throw new ValidationError(`Trip not found for tripId=${tripId}`, 404);
    }
    trip.destinationImages = await getObjectsFromS3Bucket(
      process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
      trip.destinationImages,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );

    const updatedMembersPromises = await trip.tripMembers.map(
      async (member) => {
        member.profilePic = await getObjectsFromS3Bucket(
          "",
          member.profilePic,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
        );
        return member;
      }
    );

    trip.tripMembers = await Promise.all(updatedMembersPromises);

    logger.info(`fetched trip with tripId=${tripId}, trip=${trip}`);
    return trip;
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
    if (newDestinationImages && newDestinationImages.length > 0) {
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(
          process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
          newDestinationImages,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );

      newDestinationImages = await cropAndResizeImages(newDestinationImages);

      const { uploadedObjectNames: croppedImagesNames } =await uploadObjectsToS3Bucket(
        process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
        newDestinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );

      deleteObjectsFromS3Bucket(
        process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
        tripInDatabase.destinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );

      deleteObjectsFromS3Bucket(
        process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
        tripInDatabase.destinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );

      tripInDatabase.destinationImages = uploadedObjectNames;
      tripInDatabase.croppedDestinationImages = croppedImagesNames;
      allFilesUploaded = allObjectsUploaded;
    }

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
    const { offset = 0, limit = process.env.LIMIT_FOR_SENDING_TRIPS } = filter;
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

    await addCroppedDestinationImagesToTrips(
      trips,
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES
    );
    logger.info(
      `Fetched trips with filter=${filter} for user with userId=${userId}, trips=${trips}`
    );
    return { trips, newOffset };
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
      limit = process.env.LIMIT_FOR_SENDING_TRIPS,
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
    await addCroppedDestinationImagesToTrips(
      trips,
      process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES
    );
    logger.info(`Fetched trips with filter=${filter}, trips=${trips}`);
    return { trips, newOffset };
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

async function generateTripLink(tripId, userId) {
  try {
    const tripInDatabase = await tripRepository.findTripWithTripIdAndUserId(
      tripId,
      userId
    );

    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip not found or user doesn't have permssion to generate trip link for trip with tripId=${tripId}, userId=${userId}`,
        404
      );
    }

    if (tripInDatabase.totalMembers >= 20) {
      throw new ValidationError(
        `Exceeded maximum members allowed per trip, tripId=${tripId}, userId=${userId}, totalMembers=${tripInDatabase.totalMembers}`,
        403
      );
    }
    return generateToken(
      tripId,
      process.env.SECRET_KEY_FOR_GENERATING_TRIP_LINK,
      "2h"
    );
  } catch (error) {
    logger.error(
      `Error occurred while generating trip link for user, userId=${userId}, tripId=${tripId}`
    );
    throw error;
  }
}

async function joinTrip(trip, user) {
  try {
    trip.tripMembers = trip.tripMembers.filter(
      (member) => member.userId !== user.userId
    );
    trip.tripMembers.push(user);
    const updatedTrip = tripRepository.updateTrip(trip);
    return updatedTrip;
  } catch (error) {
    logger.error(
      `Error occurred while joining user to trip, user=${JSON.stringify(
        user
      )}, trip=${JSON.stringify(trip)}`
    );
  }
  throw error;
}

module.exports = {
  createTrip,
  getTripById,
  getTripsWithFilter,
  editTrip,
  deleteTrip,
  getTripsByUser,
  generateTripLink,
  joinTrip,
};
