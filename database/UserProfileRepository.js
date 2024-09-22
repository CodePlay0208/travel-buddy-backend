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
    throw new Error(`Error updating user profile in DB: ${error}`);
  }
}

async function deleteUserById(userId) {
  try {
    await UserProfile.findByIdAndDelete(userId);
  } catch (err) {
    logger.error(`Error occured while deleting user with userId=${userId}`);
    throw new Error(`Error deleting user profile from DB: ${err.message}`);
  }
}

module.exports = { updateUser, deleteUserById };
