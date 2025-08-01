const logger = require("../logger");
const OtpSchema = require("../models/OtpModel");

async function create(userId, otp, userKey) {
  try {
    logger.info(`Creating OTP for userId=${userId}, userKey=${userKey}`);
    
    const newOTP = new OtpSchema({
      userId,
      otp,
      userKey
    });
    await newOTP.save();
    
    logger.info(`Successfully created OTP for userId=${userId}, userKey=${userKey}`);
  } catch (error) {
    logger.error(`Failed to create OTP for userId=${userId}, userKey=${userKey}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while creating OTP for user with userId=${userId}, error=${error.message}`);
  }
}

async function findOtpWithUserId(userId) {
  try {
    logger.info(`Finding OTP for userId=${userId}`);
    
    const otp = await OtpSchema.findOne({ userId }).sort({
      createdAt: -1,
    }).lean();
    
    if (otp) {
      logger.info(`Found OTP for userId=${userId}`);
    } else {
      logger.warn(`No OTP found for userId=${userId}`);
    }
    
    return otp;
  } catch (error) {
    logger.error(`Failed to find OTP for userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while finding OTP for user with userId=${userId}, error=${error.message}`);
  }
}

module.exports = { create, findOtpWithUserId };
