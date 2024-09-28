const logger = require("../Logger");
const OtpSchema = require("../models/OtpModel");

async function create(userId, otp) {
  try {
    const newOTP = new OtpSchema({
      userId,
      otp,
    });
    await newOTP.save();
  } catch (error) {
    logger.error(
      `Error occurred while creating otp user for user with userId=${userId}`
    );
    throw new Error(
      `Error occurred while creating otp for user with userId=${userId}, error=${error}`
    );
  }
}

async function findOtpWithUserId(userId) {
  try {
    const otp = await OtpSchema.findOne({ userId }).sort({
      createdAt: -1,
    });
    return otp;
  } catch (error) {
    logger.error(
        `Error occurred while finding otp user for user with userId=${userId}`
      );
      throw new Error(
        `Error occurred while finding otp for user with userId=${userId}, error=${error}`
      );
  }
}

module.exports = { create, findOtpWithUserId };
