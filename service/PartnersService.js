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
} = require("../aws/S3");
const { cropAndResizeImages } = require("../Utils.js");

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}

async function sendOTPHelper(useremail, otp) {
  try {
    logger.info(`Sending otp to user with emailId=${useremail}`);
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

    const url = process.env.API_FOR_SENDING_MAILS;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": process.env.API_KEY_FOR_SENDING_MAILS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailingData),
    });

    await response.json();
    logger.info(`OTP sent successfully to user with emailId=${useremail}`);
  } catch (error) {
    logger.error(
      `Error while sending OTP to user with emailId=${useremail}, error=${error}`
    );
    throw error;
  }
}

async function login(userId, userOtp) {
  try {
    const originalOtp = await partnersOtpRepository.findOtpWithUserId(userId);

    if (!originalOtp || originalOtp.otp != userOtp) {
      throw new ValidationError("Otp Verification Failed");
    }

    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to verify otp for user with userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function sendOtp(useremail) {
  try {
    const userInDatabase = await partnersProfileRepository.findUserWithEmailId(
      useremail
    );

    if (!userInDatabase) {
      throw new ValidationError("User Doesn't Exists");
    }
    const userId = userInDatabase.userId;
    const otp = generateOTP();
    await sendOTPHelper(useremail, otp);
    logger.info(
      `Successfully sent otp=${otp} to user with emailId=${useremail}`
    );
    await partnersOtpRepository.create(userId, otp);
    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to send otp to user with emailId=${useremail}, error=${error}`
    );
    throw error;
  }
}

async function setAgentData(payload) {
  try {
    const agentDataId = uuidv4();
    const callDate = dateFromDateString(payload.callDate);
    const agentData = {
      ...payload,
      agentDataId,
      callDate,
    };

    await agentDataRepository.createAgentData(agentData);
  } catch (error) {
    logger.error(`Failed to create agentData=${payload}, error=${error}`);
    throw error;
  }
}

async function getAgentsData() {
  try {
    const agentsData = await agentDataRepository.getAgentsData();
    return agentsData;
  } catch (error) {
    logger.error(`Failed to fetch agents Data, error=${error}`);
    throw error;
  }
}

async function scheduleTrips() {
  try {
    logger.info("Scheduling trips using partners endpoint");
    await generateTripInstancesFor3Months();
  } catch (error) {
    logger.error(
      `Error occurred while scheduling trips using partners service, error=${error}`
    );
    throw error;
  }
}

async function setupProfile(updateData, newProfilePic) {
  try {
    logger.info(`Setting up profile using partners service`);
    const sanitizedUpdateData = {};
    const userId = uuidv4();
    if (updateData.username) sanitizedUpdateData.username = updateData.username;
    if (updateData.dateOfBirth)
      sanitizedUpdateData.dateOfBirth = updateData.dateOfBirth;
    if (updateData.persona) sanitizedUpdateData.persona = updateData.persona;
    if (updateData.profilePic)
      sanitizedUpdateData.profilePic = updateData.profilePic;
    if (updateData.gender) sanitizedUpdateData.gender = updateData.gender;
    if (newProfilePic && newProfilePic.length > 0) {
      newProfilePic.forEach((profilePic) => {
        profilePic.originalname = randomFileName(profilePic.originalname);
      });
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(
          "",
          newProfilePic,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
        );
      sanitizedUpdateData.profilePic = uploadedObjectNames;
    }
    let { userKey } = updateData;
    const { isPhoneNumber } = isPhoneNumberOrEmail(userKey);
    if (isPhoneNumber) {
      sanitizedUpdateData.isSignupWithEmail = false;
      sanitizedUpdateData.phoneNumber = userKey;
    } else {
      sanitizedUpdateData.isSignupWithEmail = true;
      sanitizedUpdateData.emailId = userKey;
    }
    sanitizedUpdateData.userId = userId;
    var updatedUserProfile = await userProfileRepository.create(
      sanitizedUpdateData
    );
  } catch (error) {
    logger.error(
      `Error occurred while setting profile using partners service, error=${error}`
    );
    throw error;
  }
}

async function publishTrip(payload) {
  try {
    let { userKey } = payload;
    logger.info(`publish trip using partners service, trips=${payload}`);
    try {
      const { isPhoneNumber } = isPhoneNumberOrEmail(userKey);
      let user;
      if (isPhoneNumber) {
        user = await userProfileRepository.findUserByPhoneNumber(userKey);
      } else {
        user = await userProfileRepository.findUserWithEmailId(userKey);
      }
      if (!user) {
        throw new ValidationError(`User doesn't exists`, 400);
      }
      const userId = user.userId;
      const baseTripId = uuidv4();
      const baseTrip = {
        destination: payload.destination,
        startLocation: payload.startLocation,
        minBudget: payload.minBudget,
        maxBudget: payload.maxBudget,
        title: payload.title,
        description: payload.description,
        dayTabs: payload.dayTabs,
        inc_exc: payload.inc_exc,
        baseTripId,
        hostId: userId,
        duration: payload.duration,
        scheduledWeekdays: payload.scheduledWeekdays,
      };

      const createdBaseTrip = await baseTripRepository.createTrip(baseTrip);
      const { tripDates: strTripDates } = payload;
      const tripDates = Array.from(strTripDates);

      const tripInstances = tripDates.map((tripDate) => {
        const { startDate, endDate } = tripDate;
        const queryStartDate = dateFromDateString(startDate);
        const queryEndDate = dateFromDateString(endDate);
        const tripInstanceId = uuidv4();
        const tripInstance = {
          tripInstanceId,
          baseTripId,
          hostId: userId,
          destination: payload.destination,
          startLocation: payload.startLocation,
          startDate: queryStartDate,
          endDate: queryEndDate,
        };
        return tripInstance;
      });

      const createdTripInstances =
        await tripInstancesRepository.createInstances(tripInstances);

      tripInstances.forEach(async (tripInstance) => {
        const userTrips = await userTripsRepository.updateUserTrips(
          userId,
          tripInstance.tripInstanceId,
          true,
          true,
          false,
          false
        );
      });

      return baseTripId;
    } catch (error) {
      logger.error(
        `Error creating trip with payload=${JSON.stringify(
          payload
        )}, error=${error}`
      );
      throw error;
    }
  } catch (error) {
    logger.error(
      `Error occurred while publish trips using partners service, error=${error}`
    );
    throw error;
  }
}


async function createTripsImages(newPayload, newDestinationImages, userId) {
  const baseTripId = newPayload.baseTripId;
  try {
    const tripInDatabase = await baseTripRepository.findTripWithTripId(
      baseTripId
    );
    if (!tripInDatabase) {
      throw new ValidationError(
        `Trip with baseTripId=${baseTripId} not found`,
        400
      );
    }

    if (
      tripInDatabase.destinationImages &&
      tripInDatabase.destinationImages.length > 0
    ) {
      throw new ValidationError(`Images already created for this trip`, 400);
    }

    if (newDestinationImages && newDestinationImages.length > 0) {
      newDestinationImages.forEach((newDestinationImage) => {
        newDestinationImage.originalname = randomFileName(
          newDestinationImage.originalname
        );
      });

      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(
          process.env.PATH_FOR_FULL_DESTINATION_IMAGES,
          newDestinationImages,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );

      newDestinationImages = await cropAndResizeImages(newDestinationImages);

      const {
        uploadedObjectNames: croppedImagesNames,
        allObjectsUploaded: allCroppedImagesUploaded,
      } = await uploadObjectsToS3Bucket(
        process.env.PATH_FOR_CROPPED_DESTINATION_IMAGES,
        newDestinationImages,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );
      tripInDatabase.destinationImages = uploadedObjectNames;
      tripInDatabase.croppedDestinationImages = croppedImagesNames;
      allFilesUploaded = allObjectsUploaded && allCroppedImagesUploaded;
      const updatedTrip = await baseTripRepository.updateTrip(tripInDatabase);
    }
    logger.info(`created images for Trip with baseTripId=${baseTripId} using partners service`);
  } catch (error) {
    logger.error(
      `Error creating images for baseTripId=${baseTripId} using partners service, error=${error}`
    );
    throw error;
  }
}

module.exports = {
  sendOtp,
  login,
  setAgentData,
  getAgentsData,
  scheduleTrips,
  setupProfile,
  publishTrip,
  createTripsImages
};
