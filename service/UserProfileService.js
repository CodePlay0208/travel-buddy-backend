const logger = require("../Logger");
const userProfileRepository = require("../repositories/UserProfileRepository.js");
const tripRepository = require("../repositories/TripRepository.js");
const deletedUserRepository = require("../repositories/DeletedUserRepository.js");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
} = require("../aws/S3");

async function getUserProfile(user) {
  try {
    const userId = user.userId;
    logger.info(`Fetching user with userId=${userId}`);
    const userProfilePic = await getObjectsFromS3Bucket(
      user.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    user.profilePic = userProfilePic;
    logger.info(
      `Fetched user profile with userId=${userId}, updateUserProfile=${user}`
    );
    return user;
  } catch (error) {
    logger.error(`Failed to find profile pic for user=${user}, error=${error}`);
    throw error;
  }
}

async function updateUserProfile(user, updateData, newProfilePic) {
  try {
    const userId = user.userId;
    logger.info(`Updating user with userId=${userId}`);
    const sanitizedUpdateData = {};

    if (updateData.username) sanitizedUpdateData.username = updateData.username;
    if (updateData.dateOfBirth)
      sanitizedUpdateData.dateOfBirth = updateData.dateOfBirth;
    if (updateData.persona) sanitizedUpdateData.persona = updateData.persona;
    if (updateData.phoneNumber)
      sanitizedUpdateData.phoneNumber = updateData.phoneNumber;
    if (updateData.profilePic)
      sanitizedUpdateData.profilePic = updateData.profilePic;

    if (newProfilePic && newProfilePic.length > 0) {
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(
          newProfilePic,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
        );
      deleteObjectsFromS3Bucket(
        user.profilePic,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      sanitizedUpdateData.profilePic = uploadedObjectNames;
    }

    const updatedUserProfile = await userProfileRepository.updateUser(
      userId,
      sanitizedUpdateData
    );
    logger.info(
      `updated user profile with userId=${userId}, updateUserProfile=${updatedUserProfile}`
    );

    return updatedUserProfile;
  } catch (error) {
    logger.error(`Failed to update user=${user}, error=${error}`);
    throw error;
  }
}

async function deleteUserProfile(user) {
  try {
    const { userId, username, emailId } = user;
    logger.info(`Deleting user profile with userId=${userId}`);
    const deletedUser = {
      userId,
      username,
      emailId,
    };

    tripRepository.deleteTripsByUserId(userId);
    deleteObjectsFromS3Bucket(
      user.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    userProfileRepository.deleteUserByUserId(userId);
    deletedUserRepository.create(deletedUser);

    logger.info(
      `User profile and related data deleted for user with userId=${userId}`
    );
  } catch (error) {
    logger.error(`Error while deleting user=${user}, error=${error}`);
    throw error;
  }
}

module.exports = { updateUserProfile, deleteUserProfile, getUserProfile };
