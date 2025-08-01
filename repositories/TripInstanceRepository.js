const TripInstance = require("../models/TripInstanceModel");
const logger = require("../logger");

async function createInstances(tripInstances) {
  try {
    logger.info(`Creating ${tripInstances?.length || 0} trip instances`);
    
    const createdTrips = await TripInstance.insertMany(tripInstances);
    
    logger.info(`Successfully created ${createdTrips?.length || 0} trip instances`);
    return createdTrips;
  } catch (error) {
    logger.error(`Failed to create trip instances: count=${tripInstances?.length || 0}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while creating trip instances, error=${error.message}`);
  }
}

async function findTripWithTripId(tripInstanceId) {
  try {
    logger.info(`Finding trip with tripInstanceId=${tripInstanceId}`);
    
    const trip = await TripInstance.aggregate([
      { $match: { tripInstanceId: tripInstanceId } },
      {
        $lookup: {
          from: "basetripdataschemas",
          localField: "baseTripId",
          foreignField: "baseTripId",
          as: "baseTripData",
        },
      },
      { $unwind: "$baseTripData" },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$baseTripData", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          baseTripData: 0, // optional: remove the now-unneeded nested object
        },
      },
    ]);

    if (trip && trip.length > 0) {
      logger.info(`Found trip with tripInstanceId=${tripInstanceId}`);
    } else {
      logger.warn(`No trip found with tripInstanceId=${tripInstanceId}`);
    }

    return trip;
  } catch (error) {
    logger.error(`Failed to find trip with tripInstanceId=${tripInstanceId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while fetching trip with tripInstanceId=${tripInstanceId}, error=${error.message}`);
  }
}

async function updateTrip(trip) {
  try {
    logger.info(`Updating trip with tripInstanceId=${trip?.tripInstanceId}`);
    
    const updatedTrip = await trip.save();
    
    logger.info(`Successfully updated trip with tripInstanceId=${trip?.tripInstanceId}`);
    return updatedTrip;
  } catch (error) {
    logger.error(`Failed to update trip with tripInstanceId=${trip?.tripInstanceId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while updating trip, error=${error.message}`);
  }
}

async function findTripsWithQueryUsingAggregation(
  query,
  limit,
  offset,
  additionalFilters
) {
  try {
    logger.info(`Finding trips with aggregation: limit=${limit}, offset=${offset}, additionalFilters=${JSON.stringify(additionalFilters)}`);
    
    const trips = await TripInstance.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "basetripdataschemas",
          localField: "baseTripId",
          foreignField: "baseTripId",
          as: "baseTripData",
        },
      },
      { $unwind: "$baseTripData" },

      {
        $lookup: {
          from: "userProfiles",
          localField: "hostId",
          foreignField: "userId",
          as: "hostProfile",
        },
      },
      { $unwind: "$hostProfile" },

      ...(additionalFilters.persona
        ? [
            {
              $match: {
                "hostProfile.persona": additionalFilters.persona,
              },
            },
          ]
        : []),

      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$baseTripData", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          baseTripData: 0,
          hostProfile: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]);
    
    logger.info(`Found ${trips?.length || 0} trips with aggregation`);
    return trips;
  } catch (error) {
    logger.error(`Failed to find trips with aggregation: limit=${limit}, offset=${offset}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while fetching trips with aggregation, error=${error.message}`);
  }
}

async function findRandomTripsWithQueryUsingAggregation(query, limit) {
  try {
    logger.info(`Finding random trips with aggregation: limit=${limit}`);
    
    const trips = await TripInstance.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "basetripdataschemas",
          localField: "baseTripId",
          foreignField: "baseTripId",
          as: "baseTripData",
        },
      },
      { $unwind: "$baseTripData" },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$baseTripData", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          baseTripData: 0,
        },
      },
      { $sample: { size: limit } },
    ]);
    
    logger.info(`Found ${trips?.length || 0} random trips with aggregation`);
    return trips;
  } catch (error) {
    logger.error(`Failed to find random trips with aggregation: limit=${limit}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while fetching random trips with aggregation, error=${error.message}`);
  }
}

async function deleteTripsByUserId(hostId) {
  try {
    logger.info(`Deleting trips by hostId=${hostId}`);
    
    const result = await TripInstance.deleteMany({ hostId });
    
    logger.info(`Successfully deleted ${result.deletedCount || 0} trips for hostId=${hostId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to delete trips by hostId=${hostId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while deleting trips by hostId=${hostId}, error=${error.message}`);
  }
}

async function deleteTripsByBaseTripId(baseTripId) {
  try {
    logger.info(`Deleting trips by baseTripId=${baseTripId}`);
    
    const result = await TripInstance.deleteMany({ baseTripId });
    
    logger.info(`Successfully deleted ${result.deletedCount || 0} trips for baseTripId=${baseTripId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to delete trips by baseTripId=${baseTripId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while deleting trips by baseTripId=${baseTripId}, error=${error.message}`);
  }
}

async function getTripsByBaseTripId(baseTripId) {
  try {
    logger.info(`Getting trips by baseTripId=${baseTripId}`);
    
    const trips = await TripInstance.find({ baseTripId });
    
    logger.info(`Found ${trips?.length || 0} trips for baseTripId=${baseTripId}`);
    return trips;
  } catch (error) {
    logger.error(`Failed to get trips by baseTripId=${baseTripId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while getting trips by baseTripId=${baseTripId}, error=${error.message}`);
  }
}

async function findTripsWithQuery(query, limit, offset) {
  try {
    logger.info(`Finding trips with query: limit=${limit}, offset=${offset}`);
    
    const trips = await TripInstance.find(query).limit(limit).skip(offset);
    
    logger.info(`Found ${trips?.length || 0} trips with query`);
    return trips;
  } catch (error) {
    logger.error(`Failed to find trips with query: limit=${limit}, offset=${offset}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while finding trips with query, error=${error.message}`);
  }
}

async function deleteTripsByTripInstanceId(tripInstanceId) {
  try {
    logger.info(`Deleting trip by tripInstanceId=${tripInstanceId}`);
    
    const result = await TripInstance.deleteOne({ tripInstanceId });
    
    if (result.deletedCount > 0) {
      logger.info(`Successfully deleted trip with tripInstanceId=${tripInstanceId}`);
    } else {
      logger.warn(`No trip found to delete with tripInstanceId=${tripInstanceId}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Failed to delete trip by tripInstanceId=${tripInstanceId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while deleting trip by tripInstanceId=${tripInstanceId}, error=${error.message}`);
  }
}

async function deleteTripDates(tripDates) {
  try {
    logger.info(`Deleting trip dates: count=${tripDates?.length || 0}`);
    
    const result = await TripInstance.deleteMany({ tripInstanceId: { $in: tripDates } });
    
    logger.info(`Successfully deleted ${result.deletedCount || 0} trip dates`);
    return result;
  } catch (error) {
    logger.error(`Failed to delete trip dates: count=${tripDates?.length || 0}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while deleting trip dates, error=${error.message}`);
  }
}

async function updateTrips(baseTripId, query) {
  try {
    logger.info(`Updating trips for baseTripId=${baseTripId}`);
    
    const result = await TripInstance.updateMany({ baseTripId }, query);
    
    logger.info(`Successfully updated ${result.modifiedCount || 0} trips for baseTripId=${baseTripId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to update trips for baseTripId=${baseTripId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while updating trips for baseTripId=${baseTripId}, error=${error.message}`);
  }
}

module.exports = {
  createInstances,
  findTripWithTripId,
  updateTrip,
  findTripsWithQueryUsingAggregation,
  findRandomTripsWithQueryUsingAggregation,
  deleteTripsByUserId,
  deleteTripsByBaseTripId,
  getTripsByBaseTripId,
  findTripsWithQuery,
  deleteTripsByTripInstanceId,
  deleteTripDates,
  updateTrips,
};
