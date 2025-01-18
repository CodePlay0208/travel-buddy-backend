const TripData = require("../models/TripDataModel");
const logger = require("../logger");

async function deleteTripsByUserId(userId) {
  try {
    await TripData.deleteMany({ userId: userId });
  } catch (error) {
    logger.error(
      `Error occurred while deleting trips for user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error deleting trips for user with userId=${userId}, error=${error}`
    );
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
    const trips = TripData.find(query)
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

async function addMembersToTrip(tripId, membersToAdd) {
  try {
    await TripData.findOneAndUpdate(
      { tripId: tripId },
      { $addToSet: { requestedTripMembers: { $each: membersToAdd } } },
      { new: true }
    );
  } catch (error) {
    logger.error(
      `Error occured while adding members to trip with tripId=${trip.tripId}`
    );
    throw error;
  }
}

async function joinMemberToTrip(tripId, user) {
  try {
    const updatedTrip = await TripData.findOneAndUpdate(
      { tripId: tripId },
      {
        $pull: { requestedTripMembers: { userId: user.userId } }, 
        $addToSet: {
          tripMembers: {
            userId: user.userId,
            username: user.username,
            emailId: user.emailId,
            profilePic: user.profilePic,
          },
        }, 
      },
      { new: true } 
    );
    return updatedTrip;
  } catch (error) {
    logger.error(
      `Error occured while adding members to trip with tripId=${trip.tripId}`
    );
    throw error;
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
  addMembersToTrip,
  joinMemberToTrip,
};
