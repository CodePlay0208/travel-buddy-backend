const TempUserSignUpModel = require("../models/TempUserSignUpModel");
const logger = require("../Logger");

async function createUniqueUserWithEmailId(user) {
  try {
    const newTempSignedUser = new TempUserSignUpModel(user);
    await TempUserSignUpModel.findOneAndDelete({ emailId: user.emailId });
    await newTempSignedUser.save();
  } catch (error) {
    logger.error(
      `Error while creating user=${JSON.stringify(user)} in temporary signup collection, error=${error}`
    );
    throw new Error(error);
  }
}

async function findUserByUserId(userId) {
  try {
    const userInDatabase = await TempUserSignUpModel.findOne({ userId });
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

module.exports = { createUniqueUserWithEmailId, findUserByUserId };
