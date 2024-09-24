const TempUserSignUpModel = require("../models/TempUserSignUpModel");

async function createUniqueUserWithEmailId(user) {
  try {
    const TempUserSignUp = new TempUserSignUpModel(user);
    await TempUserSignUp.findOneAndDelete({ emailId: user.emailId });
    await newTempSignedUser.save();
  } catch (error) {
    logger.error(
      `Error while creating user in temporary signup collection, error=${error}`
    );
    throw new Error(error);
  }
}

module.exports = { createUniqueUserWithEmailId };
