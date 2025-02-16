const UserTrips = require("../models/UserTripsModel");
const logger = require("../logger");
const { ValidationError } = require("../exceptions/ValidationError");

async function updateWishlistTripForUser(userId, tripId, isWishlisted) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripId },
      {
        $set: {
          isWishlisted,
        },
      },
      { new: true, upsert: true }
    );
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while adding tripId=${tripId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while adding tripId=${tripId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function updateJoinTripForUser(userId, tripId, isJoined) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripId },
      {
        $set: {
          isJoined
        },
      },
      { new: true, upsert: true }
    );
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while adding tripId=${tripId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while adding tripId=${tripId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function updateRequestTripForUser(userId, tripId, isRequested) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId, tripId },
      {
        $set: {
          isRequested
        },
      },
      { new: true, upsert: true }
    );
    return result;
  } catch (error) {
    logger.error(
      `Error occurred while adding tripId=${tripId} to wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while adding tripId=${tripId} to wishlisted trips for user with userId=${userId}, error=${error}`
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
      .limit(limitNumber);
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

module.exports = {
  getUserTripsUsingQuery,
  updateWishlistTripForUser,
  updateJoinTripForUser,
  updateRequestTripForUser,
};
