const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const partnersOtpRepository = require("../repositories/PartnersOtpRepository");
const partnersProfileRepository = require("../repositories/PartnersProfileRepository");
const agentDataRepository = require("../repositories/AgentDataRepository");
const userProfileRepository = require("../repositories/UserProfileRepository.js");
const baseTripRepository = require("../repositories/BaseTripRepository.js");
const tripInstancesRepository = require("../repositories/TripInstanceRepository.js");
const userTripsRepository = require("../repositories/UserTripsRepository.js");
const { v4: uuidv4 } = require("uuid");
const generateToken = require("../config/GenerateToken");
const { dateFromDateString } = require("../Utils");
const {
  generateTripInstancesFor3Months,
} = require("../cron/ScheduleTripsFunction");
const { isPhoneNumberOrEmail } = require("../Utils");
const { randomFileName } = require("../Utils");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
  generatePresignedUrlFromS3
} = require("../aws/S3");
const {
  USER_PROFILE_PROJECTION_IN_SEARCH_BAR,
  USER_PROFILE_PROJECTION
} = require("../constants/Projections.js");
const { cropAndResizeImages } = require("../Utils.js");

async function findUserByUserKey(userKey) {
  try {
    logger.info(`Finding user by userKey=${userKey}`);
    
    const { isPhoneNumber } = isPhoneNumberOrEmail(userKey);
    let userInDatabase = null;
    
    if (isPhoneNumber) {
      logger.debug(`UserKey identified as phone number, searching by phone number`);
      userInDatabase = await userProfileRepository.findUserByPhoneNumber(userKey);
    } else {
      logger.debug(`UserKey identified as email, searching by email`);
      userInDatabase = await userProfileRepository.findUserWithEmailId(userKey);
    }
    
    if (userInDatabase) {
      logger.info(`Found user with userKey=${userKey}, userId=${userInDatabase.userId}`);
    } else {
      logger.warn(`No user found with userKey=${userKey}`);
    }
    
    return { userInDatabase, isPhoneNumber };
  } catch (error) {
    logger.error(`Failed to find user by userKey=${userKey}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

function generateOTP() {
  try {
    logger.debug(`Generating OTP`);
    const otp = Math.floor(100000 + Math.random() * 900000);
    logger.debug(`Generated OTP: ${otp}`);
    return otp;
  } catch (error) {
    logger.error(`Failed to generate OTP: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function sendOTPHelper(useremail, otp) {
  try {
    logger.info(`Sending OTP to partner: emailId=${useremail}`);
    
    const otpString = `Your otp is=${otp}`;
    const htmlContent = `<p>${otpString}</p>`;
    const subject = "Travmigoz partners OTP";
    const mailingData = {
      sender: {
        name: "travmigoz",
        email: process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS,
      },
      to: [
        {
          email: useremail,
          name: "travmigoz",
        },
      ],
      subject: subject,
      htmlContent: htmlContent,
    };
    
    logger.info(`Sending email via API for emailId=${useremail}`);
    const url = process.env.API_FOR_SENDING_MAILS;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": process.env.API_KEY_FOR_SENDING_MAILS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailingData),
    });

    if (!response.ok) {
      const errorBody = await response.text(); 
      logger.error(`Failed to send mail via Brevo: status=${response.status}, error=${errorBody}`);
      throw new ValidationError(errorBody, response.status);
    }
    
    const res = await response.json();
    logger.info(`OTP sent successfully to partner: emailId=${useremail}`);
  } catch (error) {
    logger.error(`Failed to send OTP to partner: emailId=${useremail}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function login(userId, userOtp) {
  try {
    logger.info(`Starting partner login: userId=${userId}`);
    
    logger.info(`Fetching original OTP from database: userId=${userId}`);
    const originalOtp = await partnersOtpRepository.findOtpWithUserId(userId);

    if (!originalOtp || originalOtp.otp != userOtp) {
      logger.warn(`OTP verification failed: userId=${userId}, providedOtp=${userOtp}, expectedOtp=${originalOtp?.otp}`);
      throw new ValidationError("Otp Verification Failed");
    }

    logger.info(`OTP verification successful: userId=${userId}`);
    logger.info(`Generating JWT token for partner: userId=${userId}`);
    const token = generateToken(userId, process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN);
    
    logger.info(`Successfully completed partner login: userId=${userId}`);
    return token;
  } catch (error) {
    logger.error(`Failed to complete partner login: userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function sendOtp(useremail) {
  try {
    logger.info(`Starting OTP send process for partner: emailId=${useremail}`);
    
    logger.debug(`Generating OTP for partner: emailId=${useremail}`);
    const otp = generateOTP();
    
    logger.info(`Sending OTP to partner: emailId=${useremail}`);
    await sendOTPHelper(useremail, otp);
    
    logger.info(`Successfully sent OTP to partner: emailId=${useremail}`);
  } catch (error) {
    logger.error(`Failed to send OTP to partner: emailId=${useremail}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function setAgentData(payload, userId) {
  try {
    logger.info(`Setting agent data for userId=${userId}`);
    
    const { name, phoneNumber } = payload;
    logger.debug(`Agent data: name=${name}, phoneNumber=${phoneNumber} for userId=${userId}`);
    
    const agentData = {
      userId,
      name,
      phoneNumber,
    };
    
    logger.info(`Creating agent data in database: userId=${userId}`);
    const createdAgentData = await agentDataRepository.createAgentData(agentData);
    
    logger.info(`Successfully created agent data: userId=${userId}, name=${name}`);
    return createdAgentData;
  } catch (error) {
    logger.error(`Failed to set agent data: userId=${userId}, name=${payload?.name}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getAgentsData(userId) {
  try {
    logger.info(`Getting agents data for userId=${userId}`);
    
    const agentsData = await agentDataRepository.getAgentsData();
    
    logger.info(`Successfully retrieved ${agentsData?.length || 0} agents data for userId=${userId}`);
    return agentsData;
  } catch (error) {
    logger.error(`Failed to get agents data: userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function scheduleTrips(userId) {
  try {
    logger.info(`Starting trip scheduling for userId=${userId}`);
    
    logger.info(`Generating trip instances for 3 months: userId=${userId}`);
    await generateTripInstancesFor3Months(userId);
    
    logger.info(`Successfully completed trip scheduling for userId=${userId}`);
  } catch (error) {
    logger.error(`Failed to schedule trips: userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function setupProfile(updateData, adminId) {
  try {
    logger.info(`Setting up partner profile for adminId=${adminId}`);
    
    logger.debug(`Processing profile picture upload for adminId=${adminId}`);
    if (updateData.profilePic) {
      const fileName = randomFileName(updateData.profilePic.originalname);
      logger.debug(`Generated filename for profile picture: ${fileName}`);
      
      logger.info(`Uploading profile picture to S3 for adminId=${adminId}`);
      const uploadedProfilePic = await uploadObjectsToS3Bucket(
        updateData.profilePic.buffer,
        fileName,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      logger.info(`Successfully uploaded profile picture to S3: adminId=${adminId}, fileName=${fileName}`);
      
      updateData.profilePic = fileName;
    }

    logger.info(`Updating partner profile in database for adminId=${adminId}`);
    const updatedProfile = await partnersProfileRepository.updatePartner(adminId, updateData);
    
    if (updatedProfile) {
      logger.info(`Successfully updated partner profile: adminId=${adminId}`);
    } else {
      logger.warn(`No partner profile found to update: adminId=${adminId}`);
    }
    
    return updatedProfile;
  } catch (error) {
    logger.error(`Failed to setup partner profile: adminId=${adminId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function publishTrip(payload, adminId) {
  try {
    logger.info(`Publishing trip for adminId=${adminId}`);
    
    const { tripData, tripInstances } = payload;
    logger.debug(`Trip data: title=${tripData?.title}, tripInstances count=${tripInstances?.length || 0}`);
    
    logger.info(`Creating base trip in database for adminId=${adminId}`);
    const baseTrip = await baseTripRepository.createTrip({
      ...tripData,
      hostId: adminId,
    });
    logger.info(`Successfully created base trip: baseTripId=${baseTrip.baseTripId}, adminId=${adminId}`);
    
    logger.info(`Creating trip instances in database for adminId=${adminId}`);
    const createdTripInstances = await tripInstancesRepository.createInstances(tripInstances);
    logger.info(`Successfully created ${createdTripInstances?.length || 0} trip instances for adminId=${adminId}`);
    
    logger.info(`Successfully published trip: baseTripId=${baseTrip.baseTripId}, adminId=${adminId}`);
    return { baseTrip, tripInstances: createdTripInstances };
  } catch (error) {
    logger.error(`Failed to publish trip: adminId=${adminId}, title=${payload?.tripData?.title}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function generatePreSignedUrl(payload, userId) {
  try {
    logger.info(`Generating pre-signed URL for partner: userId=${userId}`);
    
    const { fileName, fileType } = payload;
    logger.debug(`File details: fileName=${fileName}, fileType=${fileType} for userId=${userId}`);
    
    logger.info(`Generating pre-signed URL from S3 for userId=${userId}`);
    const preSignedUrl = await generatePresignedUrlFromS3(
      fileName,
      fileType,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    
    logger.info(`Successfully generated pre-signed URL: userId=${userId}, fileName=${fileName}`);
    return preSignedUrl;
  } catch (error) {
    logger.error(`Failed to generate pre-signed URL: userId=${userId}, fileName=${payload?.fileName}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getUserProfile(payload, adminId) {
  try {
    logger.info(`Getting user profile for partner: adminId=${adminId}`);
    
    const { userId } = payload;
    logger.debug(`User ID: ${userId} for adminId=${adminId}`);
    
    const user = await userProfileRepository.findUserByUserId(userId, USER_PROFILE_PROJECTION);
    
    if (user) {
      logger.info(`Successfully retrieved user profile: userId=${userId}, adminId=${adminId}`);
    } else {
      logger.warn(`User profile not found: userId=${userId}, adminId=${adminId}`);
    }
    
    return user;
  } catch (error) {
    logger.error(`Failed to get user profile: adminId=${adminId}, userId=${payload?.userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function generatePreSignedUrlForProfilePic(payload, adminId) {
  try {
    logger.info(`Generating pre-signed URL for profile picture: adminId=${adminId}`);
    
    const { fileName, fileType } = payload;
    logger.debug(`File details: fileName=${fileName}, fileType=${fileType} for adminId=${adminId}`);
    
    logger.info(`Generating pre-signed URL from S3 for adminId=${adminId}`);
    const preSignedUrl = await generatePresignedUrlFromS3(
      fileName,
      fileType,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    
    logger.info(`Successfully generated pre-signed URL for profile picture: adminId=${adminId}, fileName=${fileName}`);
    return preSignedUrl;
  } catch (error) {
    logger.error(`Failed to generate pre-signed URL for profile picture: adminId=${adminId}, fileName=${payload?.fileName}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = {
  findUserByUserKey,
  generateOTP,
  sendOTPHelper,
  login,
  sendOtp,
  setAgentData,
  getAgentsData,
  scheduleTrips,
  setupProfile,
  publishTrip,
  generatePreSignedUrl,
  getUserProfile,
  generatePreSignedUrlForProfilePic,
};
