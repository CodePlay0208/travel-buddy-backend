const UserTrips = require("../models/UserTripsModel");
const logger = require("../logger");
const { ValidationError } = require("../exceptions/ValidationError");

async function updateWishlistTripForUser(userId, tripInstanceId, isWishlisted) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isWishlisted,
        },
      },
      { new: true, upsert: true }
    ).lean();
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function updateJoinTripForUser(userId, tripInstanceId, isJoined) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isJoined,
        },
      },
      { new: true, upsert: true }
    ).lean();
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function updateRequestTripForUser(userId, tripInstanceId, isRequested) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isRequested,
        },
      },
      { new: true, upsert: true }
    ).lean();
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function updatePublishTripForUser(userId, tripInstanceId, isPublished) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isPublished,
        },
      },
      { new: true, upsert: true }
    ).lean();
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to published trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while adding tripInstanceId=${tripInstanceId} to published trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function getUserTripsUsingQuery(
  query,
  skip = 0,
  limitNumber = process.env.LIMIT_FOR_SENDING_WISHLISTED_TRIPS
) {
  try {
    const usersInTrip = await UserTrips.find(query)
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 })
      .lean();
    return usersInTrip;
  } catch (error) {
    logger.error(
      `Error occurred while getting data for user trip with query=${JSON.stringify(
        query
      )}, error=${error}`
    );
    throw new Error(
      `Error occurred while getting data for user trip with query=${JSON.stringify(
        query
      )}, error=${error}`
    );
  }
}

async function updateUserTrips(
  userId,
  tripInstanceId,
  isPublished,
  isJoined,
  isRequested,
  isWishlisted
) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isPublished,
          isJoined,
          isRequested,
          isWishlisted,
        },
      },
      { new: true, upsert: true }
    ).lean();
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while updating trip instances for userId=${userId} and tripIds=${tripIds}, error=${error}`
    );
    throw new Error(
      `Error occurred while updating trip instances for userId=${userId} and tripIds=${tripIds}, error=${error}`
    );
  }
}

async function updateUserTripsUsingQuery(userId, tripInstanceId, query) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      { $set: query },
      { new: true, upsert: true }
    ).lean();
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while updating trip instance for userId=${userId}, tripInstanceId=${tripInstanceId}, error=${error.message}`
    );
    throw new Error(
      `Failed to update trip instance for userId=${userId}, tripInstanceId=${tripInstanceId}`
    );
  }
}

module.exports = {
  getUserTripsUsingQuery,
  updateWishlistTripForUser,
  updateJoinTripForUser,
  updateRequestTripForUser,
  updatePublishTripForUser,
  updateUserTrips,
  updateUserTripsUsingQuery,
};
