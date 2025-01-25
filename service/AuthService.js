const bcrypt = require("bcrypt");
const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const tempUserSignUpRepository = require("../repositories/TempUserSignUpRepository");
const userProfileRepository = require("../repositories/UserProfileRepository");
const otpRepository = require("../repositories/OtpRepository");
const generateOtpEmail = require("../mailTemplates/otpMail/GenerateOtpEmail");
const generateToken = require("../config/GenerateToken");
const { v4: uuidv4 } = require("uuid");
const authValidator = require("../validators/AuthValidator");

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}

async function sendOTPHelper(name, useremail, otp) {
  try {
    logger.info(`Sending otp to user with emailId=${useremail}`);
    const otpString = `${otp}`;
    const htmlContent = generateOtpEmail(name, otpString);
    const subject = "Verify Otp";
    const mailingData = {
      sender: {
        name: "travmigoz",
        email: process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS,
      },
      to: [
        {
          email: useremail,
          name: name,
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

async function getUserDataFromGoogle(accessToken) {
  try {
    const url = process.env.GOOGLE_API_FOR_FETCHING_USER_DATA;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch user data.");
    }

    return data;
  } catch (error) {
    logger.error(`Failed to fetch user data from google with error=${error}`);
    throw error;
  }
}

async function googleLogin(googleToken) {
  try {
    const userData = await getUserDataFromGoogle(googleToken);
    const { emailAddresses, names } = userData;

    const useremail = emailAddresses[0].value;
    const username = names[0].displayName;
    let userInDatabase = await userProfileRepository.findUserWithEmailId(
      useremail
    );

    if (!userInDatabase) {
      const userId = uuidv4();
      logger.info(
        `Creating user with userId=${userId} and emailId=${useremail} in google auth`
      );
      const user = {
        username,
        emailId: useremail,
        userId,
      };
      userInDatabase = await userProfileRepository.create(user);
    }

    const currentUserId = userInDatabase.userId;
    logger.info(`loggedIn user with userId=${currentUserId} using google auth`);

    return generateToken(
      currentUserId,
      process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
    );
  } catch (error) {
    logger.error(`Failed to login user with google, error=${error}`);
    throw error;
  }
}

async function signUp(payload) {
  try {
    const userId = uuidv4();
    const { useremail, username} = payload;
    logger.info(
      `Signing Up user with email=${useremail}, username=${username}`
    );
    authValidator.validateSignUpRequest(payload);
    const userInDatabase = await userProfileRepository.findUserWithEmailId(
      useremail
    );

    if (userInDatabase) {
      logger.error("User already exists", { useremail });
      throw new ValidationError("User Already Exists");
    }

    const user = {
      username,
      emailId: useremail,
      userId
    }

    const createdUser = await userProfileRepository.create(user);

    const otp = generateOTP();
    await sendOTPHelper(username, useremail, otp);

    logger.info(
      `Successfully sent otp=${otp} for user with userId=${userId}, emailId=${useremail}`
    );
    await otpRepository.create(userId, otp);
    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW
    );
    return token;
  } catch (error) {
    logger.error(`Failed to update user profile with error=${error}`);
    throw error;
  }
}

async function sendOtp(useremail) {
  try {
    const userInDatabase = await userProfileRepository.findUserWithEmailId(
      useremail
    );
    if (!userInDatabase) {
      throw new ValidationError("User Doesn't Exists", 404);
    }
    const userId = userInDatabase.userId;
    const otp = generateOTP();
    await sendOTPHelper(userInDatabase.username, useremail, otp);
    logger.info(
      `Successfully sent otp=${otp} to user with emailId=${useremail}`
    );
    await otpRepository.create(userId, otp);
    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to send otp to user with emailId=${useremail}, error=${error}`
    );
    throw error;
  }
}

async function verifyOtp(user, userOtp) {
  try {
    const userId = user.userId;
    const originalOtp = await otpRepository.findOtpWithUserId(userId);

    if (!originalOtp || originalOtp.otp != userOtp) {
      throw new ValidationError("Otp Verification Failed");
    }

    const token = generateToken(userId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN);
    logger.info(`Successfully logged in user with userId=${userId}`);
    return token;
  } catch (error) {
    logger.error(
      `Failed to verify otp for user with user=${user}, error=${error}`
    );
    throw error;
  }
}

async function resendOtp(username, useremail, userId) {
  try {
    const otp = generateOTP();
    await sendOTPHelper(username, useremail, otp);
    logger.info(
      `Successfully sent otp=${otp} for user with userId=${userId}, emailId=${useremail}`
    );
    await otpRepository.create(userId, otp);
  } catch (error) {
    logger.error(
      `Failed to resend otp to user with userId=${userId}, error=${error}`
    );
    throw error;
  }
}

module.exports = {
  signUp,
  sendOtp,
  resendOtp,
  verifyOtp,
  googleLogin,
};
