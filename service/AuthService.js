const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const userProfileRepository = require("../repositories/UserProfileRepository");
const otpService = require("../service/OtpService");
const otpRepository = require("../repositories/OtpRepository");
const generateToken = require("../config/GenerateToken");
const { v4: uuidv4 } = require("uuid");
const authValidator = require("../validators/AuthValidator");
const { isPhoneNumberOrEmail} = require("../Utils");

async function findUserByUserKey(userKey) {
  const { isPhoneNumber } = isPhoneNumberOrEmail(userKey);
  let userInDatabase = null;
  if (isPhoneNumber) {
    userInDatabase = await userProfileRepository.findUserByPhoneNumber(userKey);
  } else {
    userInDatabase = await userProfileRepository.findUserWithEmailId(userKey);
  }
  return {userInDatabase, isPhoneNumber};
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
    const { userKey, username } = payload;
    logger.info(`Signing Up user with email=${userKey}, username=${username}`);
    authValidator.validateSignUpRequest(payload);
    const {userInDatabase, isPhoneNumber} = await findUserByUserKey(userKey);
    if (userInDatabase) {
      logger.error("User already exists", { userKey });
      throw new ValidationError("User Already Exists");
    }

    let user = null;

    if(isPhoneNumber){
      user = {
        username,
        userId,
        phoneNumber: userKey
      };
    }
    else{
      user = {
        username,
        emailId: userKey,
        userId,
      };
    }

    const createdUser = await userProfileRepository.create(user);

    await otpService.sendOtp(username, userKey, userId);
    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW
    );
    return token;
  } catch (error) {
    logger.error(`Failed to create user profile with error=${error}`);
    throw error;
  }
}

async function sendOtp(userKey) {
  try {
    const {userInDatabase, isPhoneNumber} = await findUserByUserKey(userKey);
    if (!userInDatabase) {
      throw new ValidationError("User Doesn't Exists", 404);
    }
    const userId = userInDatabase.userId;
    console
    await otpService.sendOtp(userInDatabase.username, userKey, userId);
    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to send otp to user with emailId=${userKey}, error=${error}`
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

    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
    );
    logger.info(`Successfully logged in user with userId=${userId}`);
    return token;
  } catch (error) {
    logger.error(
      `Failed to verify otp for user with user=${user}, error=${error}`
    );
    throw error;
  }
}

async function resendOtp(username, userKey, userId) {
  try {
    await otpService.sendOtp(username, userKey, userId);
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
