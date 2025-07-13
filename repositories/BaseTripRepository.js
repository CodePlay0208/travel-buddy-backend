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

async function deleteTripsByTripId(baseTripId) {
  try {
    await BaseTripModel.deleteOne({ baseTripId });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trip with baseTripId=${baseTripId}`
    );
    throw new Error(`Error deleting trip with ${baseTripId}, error=${error}`);
  }
}

async function findTripWithTripIdAndUserId(baseTripId, hostId) {
  try {
    const tripInDatabase = await BaseTripModel.findOne({
      baseTripId,
      hostId,
    }).lean();
    return tripInDatabase;
  } catch (error) {
    logger.error(
      `Error occurred while finding trips for user with userId=${hostId}, baseTripId=${baseTripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while finding trips for user with userId=${hostId}, baseTripId=${baseTripId}, error=${error}`
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
      `Error occurred while creating trips for user with userId=${newTrip.hostId}, baseTripId=${newTrip.baseTripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while creating trips for user with userId=${newTrip.hostId}, baseTripId=${newTrip.baseTripId}, error=${error}`
    );
  }
}

async function findTripWithTripId(baseTripId) {
  try {
    const trip = await BaseTripModel.findOne({ baseTripId }).lean();
    return trip;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trip with baseTripId=${baseTripId}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trip with baseTripId=${baseTripId}, error=${error}`
    );
  }
}

async function updateTrip(trip) {
  try {
    return await trip.save();
  } catch (error) {
    logger.error(
      `Error occurred while updating baseTrip=${trip}, error=${error}`
    );
    throw new Error(
      `Error occurred while updating baseTrip=${trip}, error=${error}`
    );
  }
}

async function findTripsWithQuery(query, limit, offset) {
  try {
    const trips = BaseTripModel.find(query)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
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

async function findTripsWithQueryUsingAggregation(
  query,
  limit,
  offset,
  additionalFilters
) {
  try {
    console.log(query, additionalFilters);
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
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching base trips with query=${JSON.stringify(
        query
      )}, limit=${limit}, offset=${offset}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching base trips with query=${JSON.stringify(
        query
      )}, limit=${limit}, offset=${offset}, error=${error}`
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
  findTripsWithQuery,
  findTripsWithQueryUsingAggregation,
};
