const TripData = require("../models/TripDataModel");
const logger = require("../Logger");

async function deleteTripsByUserId(userId) {
  try {
    await TripData.deleteMany({ userId: userId });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(`Error deleting trips for user with userId=${userId}, error=${error}`);
  }
}

async function deleteTripsByTripId(tripId) {
  try {
    await TripData.deleteOne({ tripId });
  } catch (error) {
    logger.error(`Error occurred while deleting trip with tripId=${tripId}`);
    throw new Error(`Error deleting trip with ${tripId}, error=${error}`);
  }
}

async function findTripWithTripIdAndUserId(tripId, userId) {
  try {
    const tripInDatabase = await TripData.findOne({
      tripId,
      userId,
    });
    return tripInDatabase;
  } catch (error) {
    logger.error(
      `Error occurred while finding trips for user with userId=${userId}, tripId=${tripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while finding trips for user with userId=${userId}, tripId=${tripId}, error=${error}`
    );
  }
}

async function createTrip(newTrip) {
  try {
    const tripInDatabase = new TripData(newTrip);
    const createdTrip = await tripInDatabase.save();
    return createdTrip;
  } catch (error) {
    logger.error(
      `Error occurred while creating trips for user with userId=${newTrip.userId}, tripId=${newTrip.tripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while creating trips for user with userId=${newTrip.userId}, tripId=${newTrip.tripId}, error=${error}`
    );
  }
}

async function findTripWithTripId(tripId) {
  try {
    const trip = await TripData.findOne({ tripId });
    return trip;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trip with tripId=${newTrip.tripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trip with tripId=${newTrip.tripId}, error=${error}`
    );
  }
}

async function updateTrip(trip) {
  try {
    await trip.save();
  } catch (error) {
    logger.error(
      `Error occurred while updating trip=${trip}, error=${error}`
    );
    throw new Error(
      `Error occurred while updating trip=${trip}, error=${error}`
    );
  }
}

async function findTripsWithQuery(query, limit, offset) {
  try {
    const trips = TripData.find(query).skip(offset).limit(limit).sort({ createdAt: -1 });
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trips with query=${JSON.stringify(query)}, limit=${limit}, offset=${offset}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trips with query=${query}, limit=${limit}, offset=${offset}, error=${error}`
    );
  }
}

module.exports = {
  deleteTripsByUserId,
  findTripWithTripIdAndUserId,
  deleteTripsByTripId,
  createTrip,
  findTripWithTripId,
  updateTrip,
  findTripsWithQuery
};
