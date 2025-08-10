const TripInstance = require("../models/TripInstanceModel");
const logger = require("../logger");

async function createInstances(tripInstances) {
  try {
    const createdTrips = await TripInstance.insertMany(tripInstances);
    return createdTrips;
  } catch (error) {
    logger.error(
      `Error occurred while creating instances tripInstances=${JSON.stringify(
        tripInstances
      )}, error=${error}`
    );
    throw new Error(
      `Error occurred while creating instances tripInstances=${JSON.stringify(
        tripInstances
      )}, error=${error}`
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
    logger.error(
      `Error occurred while updating tripInstance=${trip}, error=${error}`
    );
    throw new Error(
      `Error occurred while updating tripInstance=${trip}, error=${error}`
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
    const aggregationPipeline = [
      { $match: query },

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

      {
        $addFields: {
          tripInstanceId: { $toString: "$tripInstanceId" }
        }
      },

      {
        $lookup: {
          from: "usertrips",
          let: { tripInstanceId: "$tripInstanceId" },
          pipeline: [
            { $addFields: { tripInstanceId: { $toString: "$tripInstanceId" } } },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tripInstanceId", "$$tripInstanceId"] },
                    { $eq: ["$isJoined", true] }
                  ]
                }
              }
            }
          ],
          as: "userTripsData"
        }
      },

      {
        $addFields: {
          memberCount: { $size: "$userTripsData" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$baseTripData", "$$ROOT"],
          },
        },
      },

      ...(additionalFilters?.persona
        ? [
          {
            $match: {
              "hostProfile.persona": additionalFilters.persona,
            },
          },
        ]
        : []),

      ...(additionalFilters?.minTotalMember || additionalFilters?.maxTotalMember
        ? [
          {
            $match: {
              ...(additionalFilters.minTotalMember && {
                memberCount: { $gte: Number(additionalFilters.minTotalMember) },
              }),
              ...(additionalFilters.maxTotalMember && {
                memberCount: {
                  ...((additionalFilters.minTotalMember && {
                    $gte: Number(additionalFilters.minTotalMember),
                  }) || {}),
                  $lte: Number(additionalFilters.maxTotalMember),
                },
              }),
            },
          },
        ]
        : []),


      ...(additionalFilters?.minDuration || additionalFilters?.maxDuration
        ? [
          {
            $match: {
              ...(additionalFilters.minDuration && {
                duration: { $gte: Number(additionalFilters.minDuration) },
              }),
              ...(additionalFilters.maxDuration && {
                duration: {
                  ...((additionalFilters.minDuration && {
                    $gte: Number(additionalFilters.minDuration),
                  }) || {}),
                  $lte: Number(additionalFilters.maxDuration),
                },
              }),
            },
          },
        ]
        : []),

      ...(additionalFilters?.minBudget || additionalFilters?.maxBudget
        ? [
          {
            $match: {
              ...(additionalFilters.minBudget && {
                minBudget: { $gte: Number(additionalFilters.minBudget) },
              }),
              ...(additionalFilters.maxBudget && {
                maxBudget: {
                  ...((additionalFilters.minBudget && {
                    $gte: Number(additionalFilters.minBudget),
                  }) || {}),
                  $lte: Number(additionalFilters.maxBudget),
                },
              }),
            },
          },
        ]
        : []),
      ...(additionalFilters?.preferences && Array.isArray(additionalFilters.preferences) && additionalFilters.preferences.length
        ? [
          {
            $match: {
              preferences: { $in: additionalFilters.preferences },
            },
          },
        ]
        : []),
      {
        $project: {
          hostProfile: 0,
          userTripsData: 0,
        },
      },

      ...((additionalFilters?.sortBy === 'budgetLowToHigh') ? [{ $sort: { minBudget: 1 } }] : []),
      ...((additionalFilters?.sortBy === 'budgetHighToLow') ? [{ $sort: { maxBudget: -1 } }] : []),
      ...((additionalFilters?.sortBy === 'durationShortest') ? [{ $sort: { duration: 1 } }] : []),
      ...((additionalFilters?.sortBy === 'durationLongest') ? [{ $sort: { duration: -1 } }] : []),
      ...((additionalFilters?.sortBy === 'groupSizeSmallest') ? [{ $sort: { memberCount: 1 } }] : []),
      ...((additionalFilters?.sortBy === 'groupSizeLargest') ? [{ $sort: { memberCount: -1 } }] : []),

      ...((!additionalFilters?.sortBy) ? [{ $sort: { createdAt: -1 } }] : []),
      { $skip: offset },
      { $limit: limit },
    ];

    const trips = await TripInstance.aggregate(aggregationPipeline);
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trips with query=${JSON.stringify(
        query
      )}, limit=${limit}, offset=${offset}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trips with query=${JSON.stringify(
        query
      )}, limit=${limit}, offset=${offset}, error=${error}`
    );
  }
}

async function findRandomTripsWithQueryUsingAggregation(query, limit) {
  try {
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
    return trips;
  } catch (error) {
    logger.error(
      `Error occurred while fetching trips with query=${JSON.stringify(
        query
      )}, limit=${limit}, error=${error}`
    );
    throw new Error(
      `Error occurred while fetching trips with query=${JSON.stringify(
        query
      )}, limit=${limit}, error=${error}`
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
    const trips = await TripInstance.find({ baseTripId }).lean();
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

async function deleteTripDates(tripDates) {
  try {
    await TripInstance.deleteMany({ $or: tripDates });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips=${tripDates}, error=${error}`
    );
    throw new Error(
      `Error deleting trips for trips=${tripDates}, error=${error}`
    );
  }
}

async function updateTrips(baseTripId, query) {
  try {
    await TripInstance.updateMany({ baseTripId }, { $set: query });
  } catch (error) {
    logger.error(
      `Error occurred while updating tripInstances for baseTripId=${baseTripId}, query=${JSON.stringify(
        query
      )}, error=${error}`
    );
    throw new Error(
      `Error occurred while updating tripInstances for baseTripId=${baseTripId}, query=${JSON.stringify(
        query
      )}, error=${error}`
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
  deleteTripsByTripInstanceId,
  deleteTripDates,
  updateTrips,
};
