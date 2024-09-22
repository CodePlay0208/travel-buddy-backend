const logger = require("../Logger");
const userProfileRepository = require("../database/UserProfileRepository");
const tripRepository = require("../database/TripRepository");
const deletedUserRepository = require("../database/DeletedUserRepository.js");

async function updateUserProfile(userId, updateData) {
  try {
    logger.info(
      `Updating user with userId=${userId} with values=${updateData}`
    );
    const sanitizedUpdateData = {};

    if (updateData.username) sanitizedUpdateData.username = updateData.username;
    if (updateData.dateOfBirth)
      sanitizedUpdateData.dateOfBirth = updateData.dateOfBirth;
    if (updateData.persona) sanitizedUpdateData.persona = updateData.persona;
    if (updateData.phoneNumber)
      sanitizedUpdateData.phoneNumber = updateData.phoneNumber;
    if (updateData.profilePic)
      sanitizedUpdateData.profilePic = updateData.profilePic;

    const updatedUserProfile = await userProfileRepository.updateUser(
      userId,
      sanitizedUpdateData
    );
    logger.info(
      `updated user profile with userId=${userId}, updateUsrProfile=${updatedUserProfile}`
    );

    return updatedUserProfile;
  } catch (error) {
    logger.error(`Failed to update user profile with error=${error}`);
    throw error;
  }
}

async function deleteUserProfile(userId, username, emailId) {
  try {
    logger.info(`Initiating deletion for user with userId=${userId}`);

    const deletedUser = {
      userId,
      username,
      emailId,
    };

    deletedUserRepository.create(deletedUser);

    await userProfileRepository.deleteUserById(userId);
    await tripRepository.deleteTripsByUserId(userId);

    logger.info(
      `User profile and related data deleted for user with userId=${userId}`
    );
  } catch (error) {
    logger.error(`Error in userService while deleting user, error=${error}`);
    throw error;
  }
}

module.exports = { updateUserProfile, deleteUserProfile };
