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
const UserProfileModel = require("../models/UserProfileModel.js");
const { randomFileName } = require("../Utils.js");

async function getUserProfile(userId) {
  try {
    logger.info(`Fetching user with userId=${userId}`);

     const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!user) {
      logger.info(`User not found with userId=${userId}`);
      throw new ValidationError(`User not present in the database`, 400);
    }

    const userObj = user.toObject();

    if(userObj.isEmailPrivate && userObj.userId === userId){
      delete userObj.emailId;
    }
    if(userObj.isPhoneNumberPrivate && userObj.userId === userId){
      delete userObj.phoneNumber;
    }

    const userProfilePic = await getObjectsFromS3Bucket(
      "",
      userObj.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    userObj.profilePic = userProfilePic;
    logger.info(
      `Fetched user profile with userId=${userId}, userProfile=${userObj}`
    );
    return userObj;
  } catch (error) {
    logger.error(`Failed to find profile pic for userId=${userId}, error=${error}`);
    throw error;
  }
}

async function updateUserProfile(userId, updateData, newProfilePic) {
  try {
    logger.info(`Updating user with userId=${userId}`);
    const sanitizedUpdateData = {};

    const user = await userProfileRepository.findUserByUserId(userId);

    if (updateData.username) sanitizedUpdateData.username = updateData.username;
    if (updateData.dateOfBirth)
      sanitizedUpdateData.dateOfBirth = updateData.dateOfBirth;
    if (updateData.persona) sanitizedUpdateData.persona = updateData.persona;
    if (updateData.profilePic)
      sanitizedUpdateData.profilePic = updateData.profilePic;
    if(updateData.gender)
      sanitizedUpdateData.gender = updateData.gender;
    if(updateData.isEmailPrivate)
      sanitizedUpdateData.isEmailPrivate = updateData.isEmailPrivate;
    if(updateData.isPhoneNumberPrivate)
      sanitizedUpdateData.isPhoneNumberPrivate = updateData.isPhoneNumberPrivate;


    if (newProfilePic && newProfilePic.length > 0) {
      newProfilePic.forEach((profilePic) => {
        profilePic.originalname = randomFileName(
          profilePic.originalname
        );
      });
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

    const updatedUserProfileObj = updatedUserProfile.toObject();

    return updatedUserProfileObj;
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
      throw new ValidationError("User not found", 400);
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
