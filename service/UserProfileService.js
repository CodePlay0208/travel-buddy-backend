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

    if(userObj.isEmailPrivate && userObj.userId !== userId){
      delete userObj.emailId;
    }
    if(userObj.isPhoneNumberPrivate && userObj.userId !== userId){
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

async function getOtherUserProfile(userId) {
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

    if(userObj.isEmailPrivate && userObj.userId !== userId){
      delete userObj.emailId;
    }
    if(userObj.isPhoneNumberPrivate && userObj.userId !== userId){
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

    if((user.isSignupWithEmail && updateData.emailId) || (!user.isSignupWithEmail && updateData.phoneNumber)){
      const userOtp = await otpRepository.findOtpWithUserId(userId);
      if(userOtp && userOtp.otp == updateData.otp){
        if(updateData.emailId && userOtp.userKey == updateData.emailId) sanitizedUpdateData.emailId = updateData.emailId;
        if(updateData.phoneNumber && userOtp.userKey == updateData.phoneNumber) sanitizedUpdateData.phoneNumber = updateData.phoneNumber;
      }
    }

    var updatedUserProfile = await userProfileRepository.updateUser(
      userId,
      sanitizedUpdateData
    );
    const updatedUserProfileObj = updatedUserProfile.toObject();
    logger.info(
      `updated user profile with userId=${userId}, updateUserProfile=${updatedUserProfile}`
    );
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

    baseTripRepository.deleteTripsByUserId(userId);
    tripInstanceRepository.deleteTripsByUserId(userId);
    deleteObjectsFromS3Bucket(
      "",
      user.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    await userProfileRepository.deleteUserByUserId(userId);
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

async function editSecondaryKey(userId, newPayload) {
  try {
    const userInDatabase = await userProfileRepository.findUserByUserId(userId);
    if(!userInDatabase){
      throw new ValidationError(`User doesn't exists`, 400);
    }

    if((userInDatabase.isSignupWithEmail && newPayload.emailId) || (!userInDatabase.isSignupWithEmail && newPayload.phoneNumber)){
      throw new ValidationError(`Can't update primary key`, 400);
    }

    await otpService.sendOtp(userInDatabase.username, newPayload.emailId? newPayload.emailId : newPayload.phoneNumber , userId);
  } catch (error) {
    logger.error(`Failed to send otp to update secondary key of userId=${userId}, error=${error}`);
    throw error;
  }
}

async function getOtherUserProfile(userId) {
  try {
    logger.info(`Fetching other user with userId=${userId}`);

     const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!user) {
      logger.info(`User not found with userId=${userId}`);
      throw new ValidationError(`User not present in the database`, 400);
    }

    const userObj = user.toObject();

    if(userObj.isEmailPrivate && userObj.userId !== userId){
      delete userObj.emailId;
    }
    if(userObj.isPhoneNumberPrivate && userObj.userId !== userId){
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

async function generatePreSignedUrl(payload, userId) {
  const { files, prefix} = payload;
  try {
    
    const user = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!user) {
      logger.info(`User not found with userId=${userId}`);
      throw new ValidationError(`User not present in the database`, 400);
    }

    const signedUrls = await Promise.all(
      files.map(async ({ filename, filetype }) => {
        const key = `${prefix}/${filename}`;
        const params = {
          Bucket: process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC,
          Key: key,
          ContentType: filetype,
        };
        const s3Url = await generatePresignedUrlFromS3("putObject", params);
        return {s3Url, filename, filetype}
      })
    );
    return signedUrls;
  } catch (error) {
    logger.error(
      `Error occured while generating presigned url for files=${JSON.stringify(
        files
      )} with prefix=${prefix}, error=${error}`
    );
    throw error;
  }
}

async function createProfileImages(payload) {
  const objectKey = payload.detail.object.key;
  try {
    const parts = objectKey.split("/");
    const folder = parts[0];
    const userId = parts[1];
    const fileName = parts.slice(2).join("/");
    const userInDatabase = await userProfileRepository.findUserByUserId(
      userId,
      USER_PROFILE_PROJECTION
    );

    if (!userInDatabase) {
      logger.info(`User not found with userId=${userId}`);
      throw new ValidationError(`User not present in the database`, 400);
    }

    let sanitizedUpdateData = {};
    let profilePics = [];
    profilePics.push(fileName);
    sanitizedUpdateData.profilePic = profilePics;
    const updatedUser = await userProfileRepository.updateUser(userId, sanitizedUpdateData);
    logger.info(`created images for user with userId=${userId}`);
  } catch (error) {
    logger.error(
      `Error creating images for userId=${userId}, error=${error}`
    );
    throw error;
  }
}

module.exports = {
  updateUserProfile,
  deleteUserProfile,
  getUserProfile,
  findUserProfile,
  getOtherUserProfile,
  editSecondaryKey,
  generatePreSignedUrl,
  createProfileImages
};
