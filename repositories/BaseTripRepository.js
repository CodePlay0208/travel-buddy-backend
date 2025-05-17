const BaseTripModel = require("../models/BaseTripModel");
const logger = require("../logger");

async function deleteTripsByUserId(hostId) {
  try {
    await BaseTripModel.deleteMany({ hostId });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips for user with userId=${hostId}, error=${error}`
    );
    throw new Error(
      `Error deleting trips for user with userId=${hostId}, error=${error}`
    );
  }
}

async function deleteTripsByTripId(tripId) {
  try {
    await BaseTripModel.deleteOne({ tripId });
  } catch (error) {
    logger.error(`Error occurred while deleting trip with tripId=${tripId}`);
    throw new Error(`Error deleting trip with ${tripId}, error=${error}`);
  }
}

async function findTripWithTripIdAndUserId(tripId, hostId) {
  try {
    const tripInDatabase = await BaseTripModel.findOne({
      tripId,
      hostId,
    });
    return tripInDatabase;
  } catch (error) {
    logger.error(
      `Error occurred while finding trips for user with userId=${hostId}, tripId=${tripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while finding trips for user with userId=${hostId}, tripId=${tripId}, error=${error}`
    );
  }
}

async function createTrip(newTrip) {
  try {
    const tripInDatabase = new BaseTripModel(newTrip);
    const createdTrip = await tripInDatabase.save();
    return createdTrip;
  } catch (error) {
    logger.error(
      `Error occurred while creating trips for user with userId=${newTrip.hostId}, tripId=${newTrip.tripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while creating trips for user with userId=${newTrip.hostId}, tripId=${newTrip.tripId}, error=${error}`
    );
  }
}

async function findTripWithTripId(tripId) {
  try {
    const trip = await BaseTripModel.findOne({ tripId });
    return trip;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trip with tripId=${tripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trip with tripId=${tripId}, error=${error}`
    );
  }
}

async function updateTrip(trip) {
  try {
    return await trip.save();
  } catch (error) {
    logger.error(`Error occurred while updating trip=${trip}, error=${error}`);
    throw new Error(
      `Error occurred while updating trip=${trip}, error=${error}`
    );
  }
}

async function findTripsWithQuery(query, limit, offset) {
  try {
    const trips = BaseTripModel.find(query)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 });
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trips with query=${JSON.stringify(
        query
      )}, limit=${limit}, offset=${offset}, error=${error}`
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
