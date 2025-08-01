const UserProfile = require("../models/UserProfileModel");
const logger = require("../logger");
const AdminProfileModel = require("../models/AdminProfileModel");

async function updateUser(userId, updateData) {
  try {
    logger.info(`Updating user profile for userId=${userId}`);
    
    const updatedUserProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    )
      .select("-_id -password -createdAt -__v")
      .lean();

    if (updatedUserProfile) {
      logger.info(`Successfully updated user profile for userId=${userId}`);
    } else {
      logger.warn(`No user profile found to update with userId=${userId}`);
    }

    return updatedUserProfile;
  } catch (error) {
    logger.error(`Failed to update user profile for userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error updating user profile in DB, error=${error.message}`);
  }
}

async function deleteUserByUserId(userId) {
  try {
    logger.info(`Deleting user profile with userId=${userId}`);
    
    const result = await UserProfile.findOneAndDelete({ userId });
    
    if (result) {
      logger.info(`Successfully deleted user profile with userId=${userId}`);
    } else {
      logger.warn(`No user profile found to delete with userId=${userId}`);
    }
  } catch (error) {
    logger.error(`Failed to delete user profile with userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error deleting user profile with userId=${userId} from DB, error=${error.message}`);
  }
}

async function findUserWithEmailId(emailId, projection) {
  try {
    logger.info(`Finding user profile with emailId=${emailId}`);
    
    const userInDatabase = await UserProfile.findOne(
      { emailId },
      projection
    ).lean();
    
    if (userInDatabase) {
      logger.info(`Found user profile with emailId=${emailId}`);
    } else {
      logger.warn(`No user profile found with emailId=${emailId}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find user profile with emailId=${emailId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profile using emailId from DB, error=${error.message}`);
  }
}

async function findAdminByUserId(userId) {
  try {
    logger.info(`Finding admin profile with userId=${userId}`);
    
    const userInDatabase = await AdminProfileModel.findOne({ userId }).lean();
    
    if (userInDatabase) {
      logger.info(`Found admin profile with userId=${userId}`);
    } else {
      logger.warn(`No admin profile found with userId=${userId}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find admin profile with userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profile using userId=${userId} from DB, error=${error.message}`);
  }
}

async function create(user) {
  try {
    logger.info(`Creating user profile for userId=${user?.userId}, emailId=${user?.emailId}`);
    
    const saveUserInPermanentDatabase = new UserProfile(user);
    const createdUser = await saveUserInPermanentDatabase.save();
    
    logger.info(`Successfully created user profile for userId=${user?.userId}, emailId=${user?.emailId}`);
    return createdUser;
  } catch (error) {
    logger.error(`Failed to create user profile: userId=${user?.userId}, emailId=${user?.emailId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while creating user, error=${error.message}`);
  }
}

async function findUserByUserId(userId, projection) {
  try {
    logger.info(`Finding user profile with userId=${userId}`);
    
    const userInDatabase = await UserProfile.findOne(
      { userId },
      projection
    ).lean();
    
    if (userInDatabase) {
      logger.info(`Found user profile with userId=${userId}`);
    } else {
      logger.warn(`No user profile found with userId=${userId}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find user profile with userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profile using userId=${userId} from DB, error=${error.message}`);
  }
}

async function findUsersByUserId(userIds, projection) {
  try {
    logger.info(`Finding user profiles with userIds count=${userIds?.length || 0}`);
    
    const userProfiles = await UserProfile.find(
      {
        userId: { $in: userIds },
      },
      projection
    ).lean();
    
    logger.info(`Found ${userProfiles?.length || 0} user profiles out of ${userIds?.length || 0} requested`);
    return userProfiles;
  } catch (error) {
    logger.error(`Failed to find user profiles with userIds count=${userIds?.length || 0}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profiles using userIds from DB, error=${error.message}`);
  }
}

async function findUserByPhoneNumber(phoneNumber) {
  try {
    logger.info(`Finding user profile with phoneNumber=${phoneNumber}`);
    
    const userInDatabase = await UserProfile.findOne({ phoneNumber }).lean();
    
    if (userInDatabase) {
      logger.info(`Found user profile with phoneNumber=${phoneNumber}`);
    } else {
      logger.warn(`No user profile found with phoneNumber=${phoneNumber}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find user profile with phoneNumber=${phoneNumber}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profile using phoneNumber from DB, error=${error.message}`);
  }
}

async function findUsersByPrefix(prefix, projection) {
  try {
    logger.info(`Finding user profiles with prefix=${prefix}`);
    
    const regex = new RegExp(`^${prefix}`, "i");
    const users = await UserProfile.find({
      $or: [{ username: { $regex: regex } }, { emailId: { $regex: regex } }],
      projection,
    })
      .limit(process.env.LIMIT_FOR_SENDING_PREFIX_MATCHED_USERS)
      .lean();

    logger.info(`Found ${users?.length || 0} user profiles with prefix=${prefix}`);
    return users;
  } catch (error) {
    logger.error(`Failed to find user profiles with prefix=${prefix}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profiles using prefix=${prefix} from DB, error=${error.message}`);
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
  findUserByPhoneNumber,
  findAdminByUserId,
};
