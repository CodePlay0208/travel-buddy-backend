const logger = require("../logger");
const OtpSchema = require("../models/PartnersOtpModel");

async function create(userId, otp) {
  try {
    logger.info(`Starting create OTP for userId=${userId}`);
    
    const newOTP = new OtpSchema({
      userId,
      otp,
    });
    await newOTP.save();
    
    logger.info(`Successfully created OTP for userId=${userId}`);
  } catch (error) {
    logger.error(`Failed to create OTP for userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while creating OTP for userId=${userId}, error=${error.message}`);
  }
}

async function findOtpWithUserId(userId) {
  try {
    logger.info(`Finding OTP for userId=${userId}`);
    
    const otp = await OtpSchema.findOne({ userId }).sort({
      createdAt: -1,
    });
    
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
    throw new Error(`Error occurred while finding OTP for userId=${userId}, error=${error.message}`);
  }
}

module.exports = { create, findOtpWithUserId };
