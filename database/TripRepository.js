const TripData = require("../models/TripDataModel");

async function deleteTripsByUserId(userId) {
  try {
    await TripData.deleteMany({ userId });
  } catch (err) {
    logger.error(`Error occurred while deleting trips for user with userId=${userId}`)
    throw new Error(`Error deleting trips for user ${userId}: ${err.message}`);
  }
}

module.exports = { deleteTripsByUserId };
