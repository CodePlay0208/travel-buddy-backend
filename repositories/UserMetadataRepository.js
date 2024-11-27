const UserMetadata = require("../models/UserMetadataModel");
const logger = require("../logger");
const { ValidationError } = require("../exceptions/ValidationError");

async function findWishlistedTripsByUserId(userId) {
  try {
    const wishlistedTripIds = await UserMetadata.findOne({ userId });
    return wishlistedTripIds;
  } catch (error) {
    logger.error(
      `Error occurred while fetching wishlisted trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching wishlisted trips for user with userId=${userId}, error=${error}`
    );
  }
}

async function addTripToWishlistedTripsByUserId(userId, tripId) {
  try {
    const result = await UserMetadata.findOneAndUpdate(
      { userId },
      { $addToSet: { wishlistedTripIds: tripId } },
      { new: true, upsert: true }
    );
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
    const result = await UserMetadata.findOneAndUpdate(
      { userId },
      { $pull: { wishlistedTripIds: tripId } },
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

module.exports = {
  findWishlistedTripsByUserId,
  addTripToWishlistedTripsByUserId,
  removeTripFromWishlistedTripsByUserId,
};
