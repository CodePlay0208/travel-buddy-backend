const PartnerProfile = require("../models/PartnerProfileModel");
const logger = require("../logger");

async function findUserWithEmailId(emailId) {
  try {
    logger.info(`Finding partner profile with emailId=${emailId}`);
    
    const userInDatabase = await PartnerProfile.findOne({ emailId }).lean();
    
    if (userInDatabase) {
      logger.info(`Found partner profile with emailId=${emailId}`);
    } else {
      logger.warn(`No partner profile found with emailId=${emailId}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find partner profile with emailId=${emailId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profile using emailId from DB, error=${error.message}`);
  }
}

async function findUserByUserId(userId) {
  try {
    logger.info(`Finding partner profile with userId=${userId}`);
    
    const userInDatabase = await PartnerProfile.findOne({ userId }).lean();
    
    if (userInDatabase) {
      logger.info(`Found partner profile with userId=${userId}`);
    } else {
      logger.warn(`No partner profile found with userId=${userId}`);
    }
    
    return userInDatabase;
  } catch (error) {
    logger.error(`Failed to find partner profile with userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error finding user profile using userId=${userId} from DB, error=${error.message}`);
  }
}

module.exports = {
  findUserWithEmailId,
  findUserByUserId,
};
