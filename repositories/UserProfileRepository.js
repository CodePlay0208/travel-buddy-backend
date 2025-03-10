const UserProfile = require("../models/UserProfileModel");
const logger = require("../logger");


async function updateUser(userId, updateData) {
  try {
    const updatedUserProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).select("-_id -password -createdAt -__v");

    return updatedUserProfile;
  } catch (error) {
    logger.error(
      `Failed to update user with userId=${userId} in database with error=${error}`
    );
    throw new Error(`Error updating user profile in DB, error=${error}`);
  }
}

async function deleteUserByUserId(userId) {
  try {
    await UserProfile.findOneAndDelete({userId});
  } catch (error) {
    logger.error(
      `Error occured while deleting user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error deleting user profile with userId=${userId} from DB, error=${error}`
    );
  }
}

async function findUserWithEmailId(emailId, projection) {
  try {
    const userInDatabase = await UserProfile.findOne({ emailId }, projection);
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding user with emailId=${emailId}, error=${error}`
    );
    throw new Error(
      `Error finding user profile using emailId from DB, error=${error}`
    );
  }
}

async function create(user) {
  try {
    const saveUserInPermanentDatabase = new UserProfile(user);
    const createdUser = await saveUserInPermanentDatabase.save();
    return createdUser;
  } catch (error) {
    logger.error(`Error occured while creating user=${user}, error=${error}`);
    throw new Error(`Error occured while creating user with error=${error}`);
  }
}

async function findUserByUserId(userId, projection) {
  try {
    const userInDatabase = await UserProfile.findOne({ userId }, projection);
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error finding user profile using userId=${userId} from DB, error=${error}`
    );
  }
}

async function findUsersByUserId(userIds, projection) {
  try {
    const userProfiles = await UserProfile.find(
      {
        userId: { $in: userIds },
      },
      projection
    );
    return userProfiles;
  } catch (error) {
    logger.error(
      `Error occured while finding userProfiles with userIds=${userIds}, error=${error}`
    );
    throw new Error(
      `Error finding user profiles using userIds=${userIds} from DB, error=${error}`
    );
  }
}

async function findUserByPhoneNumber(phoneNumber) {
  try {
    const userInDatabase = await UserProfile.findOne({ phoneNumber });
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding user with phoneNumber=${phoneNumber}, error=${error}`
    );
    throw new Error(
      `Error finding user profile using phoneNumber from DB, error=${error}`
    );
  }
}

async function findUsersByPrefix(prefix, projection) {
  try {
    const regex = new RegExp(`^${prefix}`, "i");
    const users = await UserProfile.find({
      $or: [{ username: { $regex: regex } }, { emailId: { $regex: regex } }],
      projection,
    }).limit(LIMIT_FOR_SENDING_PREFIX_MATCHED_USERS);

    return users;
  } catch (error) {
    logger.error(
      `Error occured while finding userProfiles with prefix=${prefix}, error=${error}`
    );
    throw new Error(
      `Error finding user profiles using prefix=${prefix} from DB, error=${error}`
    );
  }
}

async function addTripToUsers(userIds, tripId) {
  try {
    await UserProfile.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { requestTrips: tripId } }
    );
    logger.info(
      `Added members userIds=${JSON.stringify(userIds)}, tripId=${tripId}`
    );
  } catch (error) {
    logger.error(
      `Failed to add members with userIds=${userIds}, to trip with tripId=${tripId} `
    );
    throw error;
  }
}

async function joinUserToTrip(userId, tripId){
  try{
    const updatedUser = await UserProfile.findOneAndUpdate(
      { userId: userId },
      { $pull: { requestingTrips: tripId } }, 
      { new: true } 
    );
    return updatedUser;
  }
  catch(error){
    logger.error(`Failed to join user with userId=${userId}, tripId=${tripId}`)
    throw error;
  }
}

module.exports = {
  updateUser,
  deleteUserByUserId,
  findUserWithEmailId,
  create,
  findUserByUserId,
  findUsersByUserId,
  findUsersByPrefix,
  addTripToUsers,
  joinUserToTrip,
  findUserByPhoneNumber
};
