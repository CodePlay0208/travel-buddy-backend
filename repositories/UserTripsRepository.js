const UserTrips = require("../models/UserTripsModel");
const logger = require("../logger");
const { ValidationError } = require("../exceptions/ValidationError");

async function updateWishlistTripForUser(userId, tripInstanceId, isWishlisted) {
  try {
    logger.info(`Updating wishlist trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isWishlisted=${isWishlisted}`);
    
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isWishlisted,
        },
      },
      { new: true, upsert: true }
    ).lean();
    
    logger.info(`Successfully updated wishlist trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isWishlisted=${isWishlisted}`);
    return result;
  } catch (error) {
    logger.error(`Failed to update wishlist trip: userId=${userId}, tripInstanceId=${tripInstanceId}, isWishlisted=${isWishlisted}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while adding tripInstanceId=${tripInstanceId} to wishlisted trips for user with userId=${userId}, error=${error.message}`);
  }
}

async function updateJoinTripForUser(userId, tripInstanceId, isJoined) {
  try {
    logger.info(`Updating join trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isJoined=${isJoined}`);
    
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isJoined,
        },
      },
      { new: true, upsert: true }
    ).lean();
    
    logger.info(`Successfully updated join trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isJoined=${isJoined}`);
    return result;
  } catch (error) {
    logger.error(`Failed to update join trip: userId=${userId}, tripInstanceId=${tripInstanceId}, isJoined=${isJoined}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while adding tripInstanceId=${tripInstanceId} to joined trips for user with userId=${userId}, error=${error.message}`);
  }
}

async function updateRequestTripForUser(userId, tripInstanceId, isRequested) {
  try {
    logger.info(`Updating request trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isRequested=${isRequested}`);
    
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isRequested,
        },
      },
      { new: true, upsert: true }
    ).lean();
    
    logger.info(`Successfully updated request trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isRequested=${isRequested}`);
    return result;
  } catch (error) {
    logger.error(`Failed to update request trip: userId=${userId}, tripInstanceId=${tripInstanceId}, isRequested=${isRequested}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while adding tripInstanceId=${tripInstanceId} to requested trips for user with userId=${userId}, error=${error.message}`);
  }
}

async function updatePublishTripForUser(userId, tripInstanceId, isPublished) {
  try {
    logger.info(`Updating publish trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isPublished=${isPublished}`);
    
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      {
        $set: {
          isPublished,
        },
      },
      { new: true, upsert: true }
    ).lean();
    
    logger.info(`Successfully updated publish trip for userId=${userId}, tripInstanceId=${tripInstanceId}, isPublished=${isPublished}`);
    return result;
  } catch (error) {
    logger.error(`Failed to update publish trip: userId=${userId}, tripInstanceId=${tripInstanceId}, isPublished=${isPublished}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while adding tripInstanceId=${tripInstanceId} to published trips for user with userId=${userId}, error=${error.message}`);
  }
}

async function getUserTripsUsingQuery(
  query,
  skip = 0,
  limitNumber = process.env.LIMIT_FOR_SENDING_WISHLISTED_TRIPS
) {
  try {
    logger.info(`Getting user trips with query: skip=${skip}, limit=${limitNumber}`);
    
    const usersInTrip = await UserTrips.find(query)
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 })
      .lean();
    
    logger.info(`Found ${usersInTrip?.length || 0} user trips with query`);
    return usersInTrip;
  } catch (error) {
    logger.error(`Failed to get user trips with query: skip=${skip}, limit=${limitNumber}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while getting user trips with query, error=${error.message}`);
  }
}

async function updateUserTripsUsingQuery(userId, tripInstanceId, query) {
  try {
    logger.info(`Updating user trips with query for userId=${userId}, tripInstanceId=${tripInstanceId}`);
    
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripInstanceId },
      query,
      { new: true, upsert: true }
    ).lean();
    
    logger.info(`Successfully updated user trips with query for userId=${userId}, tripInstanceId=${tripInstanceId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to update user trips with query: userId=${userId}, tripInstanceId=${tripInstanceId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while updating user trips with query, error=${error.message}`);
  }
}

async function deleteUserTripsByUserId(userId) {
  try {
    logger.info(`Deleting user trips by userId=${userId}`);
    
    const result = await UserTrips.deleteMany({ userId });
    
    logger.info(`Successfully deleted ${result.deletedCount || 0} user trips for userId=${userId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to delete user trips by userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while deleting user trips by userId=${userId}, error=${error.message}`);
  }
}

async function deleteUserTripsByTripInstanceId(tripInstanceId) {
  try {
    logger.info(`Deleting user trips by tripInstanceId=${tripInstanceId}`);
    
    const result = await UserTrips.deleteMany({ tripInstanceId });
    
    logger.info(`Successfully deleted ${result.deletedCount || 0} user trips for tripInstanceId=${tripInstanceId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to delete user trips by tripInstanceId=${tripInstanceId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while deleting user trips by tripInstanceId=${tripInstanceId}, error=${error.message}`);
  }
}

module.exports = {
  updateWishlistTripForUser,
  updateJoinTripForUser,
  updateRequestTripForUser,
  updatePublishTripForUser,
  getUserTripsUsingQuery,
  updateUserTripsUsingQuery,
  deleteUserTripsByUserId,
  deleteUserTripsByTripInstanceId,
};
