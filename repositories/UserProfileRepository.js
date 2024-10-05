const UserProfile = require("../models/UserProfileModel");
const logger = require("../Logger");

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
    await UserProfile.findOneAndDelete(userId);
  } catch (error) {
    logger.error(
      `Error occured while deleting user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error deleting user profile with userId=${userId} from DB, error=${error}`
    );
  }
}

async function findUserWithEmailId(emailId) {
  try {
    const userInDatabase = await UserProfile.findOne({ emailId });
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

async function findUserByUserId(userId) {
  try {
    const userInDatabase = await UserProfile.findOne({ userId });
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

async function findUsersByUserId(userIds) {
  try {
    const userProfiles = await UserProfile.find({
      userId: { $in: userIds },
    }).select("username profilePic emailId userId");
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

module.exports = {
  updateUser,
  deleteUserByUserId,
  findUserWithEmailId,
  create,
  findUserByUserId,
  findUsersByUserId,
};
