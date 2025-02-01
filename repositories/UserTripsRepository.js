const UserTrips = require("../models/UserTripsModel");
const logger = require("../logger");
const { ValidationError } = require("../exceptions/ValidationError");

async function findUserTripsUserId(userId) {
  try {
    const userTrips = await UserTrips.findOne({ userId });
    return userTrips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching user trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching user trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function addTripToWishlistedTripsByUserId(userId, tripId) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId },
      { $addToSet: { wishlistedTripsIds: tripId } },
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

async function removeTripFromWishlistedTripsByUserId(userId, tripId) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId },
      { $pull: { wishlistedTripsIds: tripId } },
      { new: true }
    );

    if (!result) {
      throw new ValidationError(`user with userId=${userId} not found`, 400);
    }
  } catch (error) {
    logger.error(
      `Error occurred while removing tripId=${tripId} from wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while removing tripId=${tripId} from wishlisted trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function addTripToRequestedTrips(tripId, userId) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId },
      { $addToSet: { requestedTripsIds: tripId } },
      { new: true, upsert: true}
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

async function addTripToJoinedTrips(tripId, userId) {
  try {
    const result = await UserTrips.findOneAndUpdate(
      { userId },
      {
        $pull: { requestedTripsIds: tripId },
        $addToSet: { joinedTripsIds: tripId },
      },
      { new: true, upsert: true}
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

module.exports = {
  findUserTripsUserId,
  addTripToWishlistedTripsByUserId,
  removeTripFromWishlistedTripsByUserId,
  addTripToRequestedTrips,
  addTripToJoinedTrips,
};
