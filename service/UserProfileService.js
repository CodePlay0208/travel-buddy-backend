const logger = require("../logger");
const userProfileRepository = require("../repositories/UserProfileRepository.js");
const tripRepository = require("../repositories/TripRepository.js");
const deletedUserRepository = require("../repositories/DeletedUserRepository.js");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
} = require("../aws/S3");
const {
  USER_PROFILE_PROJECTION_IN_SEARCH_BAR,
  USER_PROFILE_PROJECTION
} = require("../constants/Projections.js");
const { ValidationError } = require("../exceptions/ValidationError.js");

async function getUserProfile(userId) {
  try {
    logger.info(`Fetching user with userId=${userId}`);

     const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!user) {
      logger.info(`User not found with userId=${userId}`);
      throw new ValidationError("User not found", 404);
    }

    const userProfilePic = await getObjectsFromS3Bucket(
      "",
      user.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    user.profilePic = userProfilePic;
    logger.info(
      `Fetched user profile with userId=${userId}, userProfile=${user}`
    );
    return user;
  } catch (error) {
    logger.error(`Failed to find profile pic for userId=${userId}, error=${error}`);
    throw error;
  }
}

async function updateUserProfile(userId, updateData, newProfilePic) {
  try {
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
          "",
          newProfilePic,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
        );
      deleteObjectsFromS3Bucket(
        "",
        user.profilePic,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      sanitizedUpdateData.profilePic = uploadedObjectNames;
    }

    var updatedUserProfile = await userProfileRepository.updateUser(
      userId,
      sanitizedUpdateData
    );
    logger.info(
      `updated user profile with userId=${userId}, updateUserProfile=${updatedUserProfile}`
    );
    updatedUserProfile.profilePic = await getObjectsFromS3Bucket(
      "",
      updatedUserProfile.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );

    return updatedUserProfile;
  } catch (error) {
    logger.error(`Failed to update user with userId=${userId}, error=${error}`);
    throw error;
  }
}

async function deleteUserProfile(userId) {
  try {
    const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );
    
    if (!user) {
      logger.info(`User not found with userId=${userId}`);
      throw new ValidationError("User not found", 404);
    }
    const { username, emailId } = user;
    logger.info(`Deleting user profile with userId=${userId}`);
    const deletedUser = {
      userId,
      username,
      emailId,
    };

    tripRepository.deleteTripsByUserId(userId);
    deleteObjectsFromS3Bucket(
      "",
      user.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    userProfileRepository.deleteUserByUserId(userId);
    deletedUserRepository.create(deletedUser);

    logger.info(
      `User profile and related data deleted for user with userId=${userId}`
    );
  } catch (error) {
    logger.error(`Error while deleting userId=${userId}, error=${error}`);
    throw error;
  }
}

async function findUserProfile(query) {
  try {
    const userKey = query.userKey;
    logger.info(`Finding user with userKey=${userKey}`);
    const users = await userProfileRepository.findUsersByPrefix(
      userKey,
      USER_PROFILE_PROJECTION_IN_SEARCH_BAR
    );
    logger.info(
      `Fetched user profile matching prefix=${userKey}, users=${users}`
    );
    return users;
  } catch (error) {
    logger.error(`Failed to find users with prefix=${prefix}, error=${error}`);
    throw error;
  }
}

module.exports = {
  updateUserProfile,
  deleteUserProfile,
  getUserProfile,
  findUserProfile,
};
