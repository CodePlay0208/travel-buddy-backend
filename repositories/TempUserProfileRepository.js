const TempUserProfile = require("../models/TempUserProfileModel");
const logger = require("../logger");

async function deleteUserByUserId(userId) {
  try {
    logger.info(`Deleting temporary user profile with userId=${userId}`);
    
    const result = await TempUserProfile.findOneAndDelete({ userId });
    
    if (result) {
      logger.info(`Successfully deleted temporary user profile with userId=${userId}`);
    } else {
      logger.warn(`No temporary user profile found to delete with userId=${userId}`);
    }
  } catch (error) {
    logger.error(`Failed to delete temporary user profile with userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error deleting temporary user profile with userId=${userId} from DB, error=${error.message}`);
  }
}

async function findUserWithEmailId(emailId) {
  try {
    logger.info(`Finding temporary user profile with emailId=${emailId}`);
    
    const userInDatabase = await TempUserProfile.findOne({ emailId }).sort({
      createdAt: -1,
    }).lean();
    
    if (userInDatabase) {
      logger.info(`Found temporary user profile with emailId=${emailId}`);
    } else {
      logger.warn(`No temporary user profile found with emailId=${emailId}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find temporary user profile with emailId=${emailId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding temporary user profile using emailId from DB, error=${error.message}`);
  }
}

async function create(user) {
  try {
    logger.info(`Creating temporary user profile for userId=${user?.userId}, emailId=${user?.emailId}`);
    
    const saveUserInPermanentDatabase = new TempUserProfile(user);
    const createdUser = await saveUserInPermanentDatabase.save();
    
    logger.info(`Successfully created temporary user profile for userId=${user?.userId}, emailId=${user?.emailId}`);
    return createdUser;
  } catch (error) {
    logger.error(`Failed to create temporary user profile: userId=${user?.userId}, emailId=${user?.emailId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while creating temporary user, error=${error.message}`);
  }
}

async function findUserByUserId(userId) {
  try {
    logger.info(`Finding temporary user profile with userId=${userId}`);
    
    const userInDatabase = await TempUserProfile.findOne({ userId }).lean();
    
    if (userInDatabase) {
      logger.info(`Found temporary user profile with userId=${userId}`);
    } else {
      logger.warn(`No temporary user profile found with userId=${userId}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find temporary user profile with userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding temporary user profile using userId=${userId} from DB, error=${error.message}`);
  }
}

async function findUserByPhoneNumber(phoneNumber) {
  try {
    logger.info(`Finding temporary user profile with phoneNumber=${phoneNumber}`);
    
    const userInDatabase = await TempUserProfile.findOne({ phoneNumber }).sort({
      createdAt: -1,
    }).lean();
    
    if (userInDatabase) {
      logger.info(`Found temporary user profile with phoneNumber=${phoneNumber}`);
    } else {
      logger.warn(`No temporary user profile found with phoneNumber=${phoneNumber}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find temporary user profile with phoneNumber=${phoneNumber}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding temporary user profile using phoneNumber from DB, error=${error.message}`);
  }
}

module.exports = {
  deleteUserByUserId,
  findUserWithEmailId,
  create,
  findUserByUserId,
  findUserByPhoneNumber,
};
