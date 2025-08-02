const TempUserProfile = require("../models/TempUserProfileModel");
const logger = require("../logger");

async function deleteUserByUserId(userId) {
  try {
    await TempUserProfile.findOneAndDelete(userId);
  } catch (error) {
    logger.error(
      `Error occured while deleting temporary user profile with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error deleting temporary user profile with userId=${userId} from DB, error=${error}`
    );
  }
}

async function findUserWithEmailId(emailId) {
  try {
    const userInDatabase = await TempUserProfile.findOne({ emailId }).sort({
      createdAt: -1,
    }).lean();
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding temporary user profile with emailId=${emailId}, error=${error}`
    );
    throw new Error(
      `Error finding temporary user profile using emailId from DB, error=${error}`
    );
  }
}

async function create(user) {
  try {
    const saveUserInPermanentDatabase = new TempUserProfile(user);
    const createdUser = await saveUserInPermanentDatabase.save();
    return createdUser;
  } catch (error) {
    logger.error(`Error occured while creating temporary user=${user}, error=${error}`);
    throw new Error(`Error occured while creating temporary user with error=${error}`);
  }
}

async function findUserByUserId(userId) {
  try {
    const userInDatabase = await TempUserProfile.findOne({ userId }).lean();
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding temporary user profile with userId=${userId}, error=${error}`
    );
    throw new Error(
      `Error finding temporary user profile using userId=${userId} from DB, error=${error}`
    );
  }
}

async function findUserByPhoneNumber(phoneNumber) {
  try {
    const userInDatabase = await TempUserProfile.findOne({ phoneNumber }).sort({
      createdAt: -1,
    }).lean();
    return userInDatabase;
  } catch (error) {
    logger.error(
      `Error occured while finding temporary user profile with phoneNumber=${phoneNumber}, error=${error}`
    );
    throw new Error(
      `Error finding temporary user profile using phoneNumber from DB, error=${error}`
    );
  }
}

module.exports = {
  deleteUserByUserId,
  findUserWithEmailId,
  create,
  findUserByUserId,
  findUserByPhoneNumber,
};
