const logger = require("../logger");
const userProfileRepository = require("../repositories/UserProfileRepository.js");
const baseTripRepository = require("../repositories/BaseTripRepository.js");
const deletedUserRepository = require("../repositories/DeletedUserRepository.js");
const tripInstanceRepository = require("../repositories/TripInstanceRepository.js");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
  generatePresignedUrlFromS3
} = require("../aws/S3");
const {
  USER_PROFILE_PROJECTION_IN_SEARCH_BAR,
  USER_PROFILE_PROJECTION
} = require("../constants/Projections.js");
const { ValidationError } = require("../exceptions/ValidationError.js");
const UserProfileModel = require("../models/UserProfileModel.js");
const { randomFileName } = require("../Utils.js");
const otpService = require("../service/OtpService");
const otpRepository = require("../repositories/OtpRepository");

async function getUserProfile(userId) {
  try {
    logger.info(`Getting user profile for userId=${userId}`);

    logger.debug(`Fetching user from database: userId=${userId}`);
    const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!user) {
      logger.warn(`User not found in database: userId=${userId}`);
      throw new ValidationError(`User not present in the database`, 400);
    }

    logger.debug(`User found in database: userId=${userId}, username=${user.username}`);
    const userObj = user;

    logger.debug(`Processing privacy settings for userId=${userId}`);
    if(userObj.isEmailPrivate && userObj.userId !== userId){
      logger.debug(`Removing emailId due to privacy setting: userId=${userId}`);
      delete userObj.emailId;
    }
    if(userObj.isPhoneNumberPrivate && userObj.userId !== userId){
      logger.debug(`Removing phoneNumber due to privacy setting: userId=${userId}`);
      delete userObj.phoneNumber;
    }

    logger.debug(`Fetching profile picture from S3 for userId=${userId}`);
    const userProfilePic = await getObjectsFromS3Bucket(
      "",
      userObj.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    userObj.profilePic = userProfilePic;
    
    logger.info(`Successfully retrieved user profile: userId=${userId}, username=${userObj.username}`);
    return userObj;
  } catch (error) {
    logger.error(`Failed to get user profile: userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getOtherUserProfile(userId) {
  try {
    logger.info(`Getting other user profile for userId=${userId}`);

    logger.debug(`Fetching user from database: userId=${userId}`);
    const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!user) {
      logger.warn(`User not found in database: userId=${userId}`);
      throw new ValidationError(`User not present in the database`, 400);
    }

    logger.debug(`User found in database: userId=${userId}, username=${user.username}`);
    const userObj = user;

    logger.debug(`Processing privacy settings for userId=${userId}`);
    if(userObj.isEmailPrivate && userObj.userId !== userId){
      logger.debug(`Removing emailId due to privacy setting: userId=${userId}`);
      delete userObj.emailId;
    }
    if(userObj.isPhoneNumberPrivate && userObj.userId !== userId){
      logger.debug(`Removing phoneNumber due to privacy setting: userId=${userId}`);
      delete userObj.phoneNumber;
    }

    logger.debug(`Fetching profile picture from S3 for userId=${userId}`);
    const userProfilePic = await getObjectsFromS3Bucket(
      "",
      userObj.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    userObj.profilePic = userProfilePic;
    
    logger.info(`Successfully retrieved other user profile: userId=${userId}, username=${userObj.username}`);
    return userObj;
  } catch (error) {
    logger.error(`Failed to get other user profile: userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function updateUserProfile(userId, updateData, newProfilePic) {
  try {
    logger.info(`Updating user profile for userId=${userId}`);
    
    logger.debug(`Processing profile picture upload for userId=${userId}`);
    if (newProfilePic) {
      const fileName = randomFileName(newProfilePic.originalname);
      logger.debug(`Generated filename for profile picture: ${fileName}`);
      
      logger.info(`Uploading profile picture to S3 for userId=${userId}`);
      const uploadedProfilePic = await uploadObjectsToS3Bucket(
        newProfilePic.buffer,
        fileName,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      logger.info(`Successfully uploaded profile picture to S3: userId=${userId}, fileName=${fileName}`);
      
      updateData.profilePic = fileName;
    }

    logger.info(`Updating user profile in database for userId=${userId}`);
    const updatedUser = await userProfileRepository.updateUser(userId, updateData);
    
    if (updatedUser) {
      logger.info(`Successfully updated user profile: userId=${userId}, username=${updatedUser.username}`);
    } else {
      logger.warn(`No user found to update: userId=${userId}`);
    }
    
    return updatedUser;
  } catch (error) {
    logger.error(`Failed to update user profile: userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function deleteUserProfile(userId) {
  try {
    logger.info(`Deleting user profile for userId=${userId}`);
    
    logger.debug(`Fetching user profile for deletion: userId=${userId}`);
    const user = await userProfileRepository.findUserByUserId(userId);
    
    if (!user) {
      logger.warn(`User not found for deletion: userId=${userId}`);
      throw new ValidationError(`User not found`, 404);
    }
    
    logger.info(`Creating deleted user record for userId=${userId}`);
    await deletedUserRepository.create(user);
    logger.info(`Successfully created deleted user record: userId=${userId}`);
    
    logger.info(`Deleting user trips from database for userId=${userId}`);
    await baseTripRepository.deleteTripsByUserId(userId);
    await tripInstanceRepository.deleteTripsByUserId(userId);
    logger.info(`Successfully deleted user trips: userId=${userId}`);
    
    logger.info(`Deleting user profile from database for userId=${userId}`);
    await userProfileRepository.deleteUserByUserId(userId);
    logger.info(`Successfully deleted user profile: userId=${userId}`);
    
    logger.info(`Successfully completed user profile deletion: userId=${userId}`);
  } catch (error) {
    logger.error(`Failed to delete user profile: userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function findUserProfile(query) {
  try {
    logger.info(`Finding user profiles with query: ${JSON.stringify(query)}`);
    
    const users = await userProfileRepository.findUsersByPrefix(query, USER_PROFILE_PROJECTION_IN_SEARCH_BAR);
    
    logger.info(`Found ${users?.length || 0} user profiles matching query: ${query}`);
    return users;
  } catch (error) {
    logger.error(`Failed to find user profiles: query=${query}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function editSecondaryKey(userId, newPayload) {
  try {
    logger.info(`Editing secondary key for userId=${userId}`);
    
    const { newUserKey } = newPayload;
    logger.debug(`New user key: ${newUserKey} for userId=${userId}`);
    
    logger.info(`Sending OTP for secondary key change: userId=${userId}, newUserKey=${newUserKey}`);
    await otpService.sendOtp("User", newUserKey, userId);
    logger.info(`Successfully sent OTP for secondary key change: userId=${userId}`);
    
    logger.info(`Successfully initiated secondary key change: userId=${userId}, newUserKey=${newUserKey}`);
  } catch (error) {
    logger.error(`Failed to edit secondary key: userId=${userId}, newUserKey=${newPayload?.newUserKey}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function generatePreSignedUrl(payload, userId) {
  try {
    logger.info(`Generating pre-signed URL for userId=${userId}`);
    
    const { fileName, fileType } = payload;
    logger.debug(`File details: fileName=${fileName}, fileType=${fileType} for userId=${userId}`);
    
    logger.info(`Generating pre-signed URL from S3 for userId=${userId}`);
    const preSignedUrl = await generatePresignedUrlFromS3(
      fileName,
      fileType,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    
    logger.info(`Successfully generated pre-signed URL: userId=${userId}, fileName=${fileName}`);
    return preSignedUrl;
  } catch (error) {
    logger.error(`Failed to generate pre-signed URL: userId=${userId}, fileName=${payload?.fileName}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function createProfileImages(payload) {
  try {
    logger.info(`Creating profile images`);
    
    const { files } = payload;
    logger.debug(`Processing ${files?.length || 0} files for profile images`);
    
    const uploadedImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      logger.debug(`Processing file ${i + 1}/${files.length}: ${file.originalname}`);
      
      const fileName = randomFileName(file.originalname);
      logger.debug(`Generated filename: ${fileName} for file: ${file.originalname}`);
      
      logger.info(`Uploading file to S3: ${file.originalname}`);
      const uploadedImage = await uploadObjectsToS3Bucket(
        file.buffer,
        fileName,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      logger.info(`Successfully uploaded file to S3: ${file.originalname}, fileName=${fileName}`);
      
      uploadedImages.push(uploadedImage);
    }
    
    logger.info(`Successfully created ${uploadedImages.length} profile images`);
    return uploadedImages;
  } catch (error) {
    logger.error(`Failed to create profile images: files count=${payload?.files?.length || 0}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  findUserProfile,
  editSecondaryKey,
  getOtherUserProfile,
  generatePreSignedUrl,
  createProfileImages,
};
