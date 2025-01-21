const PartnerProfile = require("../models/PartnerProfileModel");
const logger = require("../logger");

async function findUserWithEmailId(emailId) {
  try {
    const userInDatabase = await PartnerProfile.findOne({ emailId });
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding user with emailId=${emailId}, error=${error}`
    );
    throw new Error(
      `Error finding user profile using emailId from DB, error=${error}`
    );
  }
}

async function findUserByUserId(userId) {
  try {
    const userInDatabase = await PartnerProfile.findOne({ userId });
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding user with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error finding user profile using userId=${userId} from DB, error=${error}`
    );
  }
}

module.exports = {
  findUserWithEmailId,
  findUserByUserId,
};
