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
          foreignField: "baseTripId",   
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
      `Error occurred while fetching trip with tripInstanceId=${tripInstanceId}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trip with tripInstanceId=${tripInstanceId}, error=${error}`
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

async function findTripsWithQueryUsingAggregation(query, limit, offset) {
  try {
    const trips = await TripInstance.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: "basetripdataschemas",             
          localField: "baseTripId",      
          foreignField: "baseTripId",   
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
          baseTripData: 0 
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit }
    ]);
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trips with query=${JSON.stringify(query)}, limit=${limit}, offset=${offset}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trips with query=${JSON.stringify(query)}, limit=${limit}, offset=${offset}, error=${error}`
    );
  }
}

async function findRandomTripsWithQueryUsingAggregation(query, limit) {
  try {
    const trips = await TripInstance.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: "basetripdataschemas",             
          localField: "baseTripId",      
          foreignField: "baseTripId",   
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
          baseTripData: 0 
        }
      },
      { $sample: { size: limit } }
    ]);
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trips with query=${JSON.stringify(query)}, limit=${limit}, offset=${offset}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trips with query=${JSON.stringify(query)}, limit=${limit}, offset=${offset}, error=${error}`
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

async function getTripsByBaseTripId(baseTripId) {
  try {
    const trips = await TripInstance.find({ baseTripId });
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips for trip with baseTripId=${baseTripId}, error=${error}`
    );
    throw new Error(
      `Error deleting trips for trip with baseTripId=${baseTripId}, error=${error}`
    );
  }
}

async function findTripsWithQuery(query, limit, offset) {
  try {
    const trips = TripInstance.find(query)
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

async function deleteTripsByTripInstanceId(tripInstanceId) {
  try {
    await TripInstance.deleteMany({ tripInstanceId });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips for trip with tripInstanceId=${tripInstanceId}, error=${error}`
    );
    throw new Error(
      `Error deleting trips for trip with tripInstanceId=${tripInstanceId}, error=${error}`
    );
  }
}



module.exports = {
  createInstances,
  findTripWithTripId,
  updateTrip,
  findTripsWithQueryUsingAggregation,
  deleteTripsByUserId,
  deleteTripsByBaseTripId,
  getTripsByBaseTripId,
  findTripsWithQuery,
  findRandomTripsWithQueryUsingAggregation,
  deleteTripsByTripInstanceId
};
