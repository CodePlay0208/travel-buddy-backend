const BaseTripModel = require("../models/BaseTripModel");
const logger = require("../logger");

async function deleteTripsByUserId(hostId) {
  try {
    logger.info(`Deleting base trips by hostId=${hostId}`);
    
    const result = await BaseTripModel.deleteMany({ hostId });
    
    logger.info(`Successfully deleted ${result.deletedCount || 0} base trips for hostId=${hostId}`);
  } catch (error) {
    logger.error(`Failed to delete base trips by hostId=${hostId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error deleting trips for user with userId=${hostId}, error=${error.message}`);
  }
}

async function deleteTripsByTripId(baseTripId) {
  try {
    logger.info(`Deleting base trip by baseTripId=${baseTripId}`);
    
    const result = await BaseTripModel.deleteOne({ baseTripId });
    
    if (result.deletedCount > 0) {
      logger.info(`Successfully deleted base trip with baseTripId=${baseTripId}`);
    } else {
      logger.warn(`No base trip found to delete with baseTripId=${baseTripId}`);
    }
  } catch (error) {
    logger.error(`Failed to delete base trip by baseTripId=${baseTripId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error deleting trip with ${baseTripId}, error=${error.message}`);
  }
}

async function findTripWithTripIdAndUserId(baseTripId, hostId) {
  try {
    logger.info(`Finding base trip with baseTripId=${baseTripId}, hostId=${hostId}`);
    
    const tripInDatabase = await BaseTripModel.findOne({
      baseTripId,
      hostId,
    }).lean();
    
    if (tripInDatabase) {
      logger.info(`Found base trip with baseTripId=${baseTripId}, hostId=${hostId}`);
    } else {
      logger.warn(`No base trip found with baseTripId=${baseTripId}, hostId=${hostId}`);
    }
    
    return tripInDatabase;
  } catch (error) {
    logger.error(`Failed to find base trip: baseTripId=${baseTripId}, hostId=${hostId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while finding trips for user with userId=${hostId}, baseTripId=${baseTripId}, error=${error.message}`);
  }
}

async function createTrip(newTrip) {
  try {
    logger.info(`Creating base trip for hostId=${newTrip?.hostId}, baseTripId=${newTrip?.baseTripId}`);
    
    const tripInDatabase = new BaseTripModel(newTrip);
    const createdTrip = await tripInDatabase.save();
    
    logger.info(`Successfully created base trip for hostId=${newTrip?.hostId}, baseTripId=${newTrip?.baseTripId}`);
    return createdTrip;
  } catch (error) {
    logger.error(`Failed to create base trip: hostId=${newTrip?.hostId}, baseTripId=${newTrip?.baseTripId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while creating trips for user with userId=${newTrip?.hostId}, baseTripId=${newTrip?.baseTripId}, error=${error.message}`);
  }
}

async function findTripWithTripId(baseTripId) {
  try {
    logger.info(`Finding base trip with baseTripId=${baseTripId}`);
    
    const trip = await BaseTripModel.findOne({ baseTripId }).lean();
    
    if (trip) {
      logger.info(`Found base trip with baseTripId=${baseTripId}`);
    } else {
      logger.warn(`No base trip found with baseTripId=${baseTripId}`);
    }
    
    return trip;
  } catch (error) {
    logger.error(`Failed to find base trip with baseTripId=${baseTripId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while fetching trip with baseTripId=${baseTripId}, error=${error.message}`);
  }
}

async function updateTrip(trip) {
  try {
    logger.info(`Updating base trip with baseTripId=${trip?.baseTripId}`);
    
    const tripInDatabase = new BaseTripModel(trip);
    const updatedTrip = await tripInDatabase.save();
    
    logger.info(`Successfully updated base trip with baseTripId=${trip?.baseTripId}`);
    return updatedTrip;
  } catch (error) {
    logger.error(`Failed to update base trip with baseTripId=${trip?.baseTripId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while updating baseTrip, error=${error.message}`);
  }
}

async function findTripsWithQuery(query, limit, offset) {
  try {
    logger.info(`Finding base trips with query: limit=${limit}, offset=${offset}`);
    
    const trips = await BaseTripModel.find(query)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    
    logger.info(`Found ${trips?.length || 0} base trips with query`);
    return trips;
  } catch (error) {
    logger.error(`Failed to find base trips with query: limit=${limit}, offset=${offset}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while fetching trips with query, limit=${limit}, offset=${offset}, error=${error.message}`);
  }
}

async function findTripsWithQueryUsingAggregation(
  query,
  limit,
  offset,
  additionalFilters
) {
  try {
    logger.info(`Finding base trips with aggregation: limit=${limit}, offset=${offset}, additionalFilters=${JSON.stringify(additionalFilters)}`);
    
    const trips = await BaseTripModel.aggregate([
      {
        $match: query,
      },
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
        $project: {
          hostProfile: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]);
    
    logger.info(`Found ${trips?.length || 0} base trips with aggregation`);
    return trips;
  } catch (error) {
    logger.error(`Failed to find base trips with aggregation: limit=${limit}, offset=${offset}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while fetching base trips with aggregation, limit=${limit}, offset=${offset}, error=${error.message}`);
  }
}

module.exports = {
  deleteTripsByUserId,
  findTripWithTripIdAndUserId,
  deleteTripsByTripId,
  createTrip,
  findTripWithTripId,
  updateTrip,
  findTripsWithQuery,
  findTripsWithQueryUsingAggregation,
};
