const UserProfile = require("../models/UserProfileModel");

async function updateUser(userId, updateData) {
  try {
    const updatedUserProfile = await UserProfile.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-_id -password -createdAt -__v");

    return updatedUserProfile;
  } catch (error) {
    logger.error(`Failed to update user in database with error=${error}`);
    throw new Error(`Error updating user profile in DB, error=${error}`);
  }
}

async function deleteUserById(userId) {
  try {
    await UserProfile.findByIdAndDelete(userId);
  } catch (error) {
    logger.error(`Error occured while deleting user with userId=${userId}`);
    throw new Error(`Error deleting user profile from DB, error=${error}`);
  }
}

async function findUserWithEmailId(emailId) {
  try {
    const userInDatabase = await UserProfile.findOne({ emailId});
    return userInDatabase;
  } catch (error) {
    logger.error(`Error occured while finding user with emailId=${emailId}`);
    throw new Error(`Error finding user profile using emailId from DB, error=${error}`);
  }
}

async function create(user) {
  try {
    const saveUserInPermanentDatabase = new UserProfile(user);
    createdUser = await saveUserInPermanentDatabase.save();
    return createdUser;
  } catch (err) {
    logger.error(`Error occured while creating user =${user}`);
    throw new Error(`Error occured while creating user=${user}, error=${error}`);
  }
}

module.exports = { updateUser, deleteUserById, findUserWithEmailId, create };
