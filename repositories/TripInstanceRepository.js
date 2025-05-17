const TripInstance = require("../models/TripInstanceModel");
const logger = require("../logger");


async function createInstances(tripInstances) {
  try {
    const createdTrips = await TripInstance.insertMany(tripInstances);
    return createdTrips;
  } catch (error) {
    logger.error(
      `Error occurred while creating instances tripInstances=${JSON.stringify(tripInstances)}, error=${error}`
    );
    throw new Error(
      `Error occurred while creating instances tripInstances=${JSON.stringify(tripInstances)}, error=${error}`
    );
  }
}

async function findTripWithTripId(tripInstanceId) {
  try {

    const trip = await TripInstance.aggregate([
      { $match: { tripInstanceId: tripInstanceId } },
      {
        $lookup: {
          from: "basetripdataschemas",             
          localField: "baseTripId",      
          foreignField: "tripId",   
          as: "baseTripData"
        }
      },
      { $unwind: "$baseTripData" } ,
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$baseTripData", "$$ROOT"]
          }
        }
      },
      {
        $project: {
          baseTripData: 0 // optional: remove the now-unneeded nested object
        }
      }
    ]);

    return trip;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trip with tripId=${tripInstanceId}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trip with tripId=${tripInstanceId}, error=${error}`
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

async function findTripsWithQueryUsingAggregation(fetchedUserTripsIds, limit, offset) {
  try {
    const trips = await TripInstance.aggregate([
      {
        $match: {
          tripId: { $in: fetchedUserTripsIds }
        }
      },
      {
        $lookup: {
          from: "basetrips",              // collection name for BaseTrip
          localField: "baseTripId",       // field in TripInstance
          foreignField: "tripId",         // field in BaseTrip
          as: "baseTripData"
        }
      },
      { $unwind: "$baseTripData" },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$baseTripData", "$$ROOT"]
          }
        }
      },
      {
        $project: {
          baseTripData: 0 // optional: remove the now-unneeded nested object
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit }
    ]);
    
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trips with tripIds=${JSON.stringify(fetchedUserTripsIds)}, limit=${limit}, offset=${offset}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trips with tripIds=${JSON.stringify(fetchedUserTripsIds)}, limit=${limit}, offset=${offset}, error=${error}`
    );
  }
}

async function deleteTripsByUserId(hostId) {
  try {
    await TripInstance.deleteMany({ hostId });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips for user with userId=${hostId}, error=${error}`
    );
    throw new Error(
      `Error deleting trips for user with userId=${hostId}, error=${error}`
    );
  }
}

async function deleteTripsByBaseTripId(baseTripId) {
  try {
    await TripInstance.deleteMany({ baseTripId });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips for trip with baseTripId=${baseTripId}, error=${error}`
    );
    throw new Error(
      `Error deleting trips for trip with baseTripId=${baseTripId}, error=${error}`
    );
  }
}



module.exports = {
  createInstances,
  findTripWithTripId,
  updateTrip,
  findTripsWithQueryUsingAggregation,
  deleteTripsByUserId
};
