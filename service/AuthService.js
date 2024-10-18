const bcrypt = require("bcrypt");
const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../Logger");
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

async function sendOTP(name, useremail, otp, status) {
  try {
    logger.info(`Sending otp to user with emailId=${useremail}`);
    const otpString = `${otp}`;
    const htmlContent = generateOtpEmail(name, useremail, otpString, status);
    const subject = status ? "Thanks for signing up" : "Verify Otp";
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
    const tempUserId = uuidv4();
    const { useremail, password, username, phoneNumber } = payload;
    logger.info(
      `Signing Up user with email=${useremail}, username=${username}, phoneNumber=${phoneNumber}, userId=${tempUserId}`
    );
    authValidator.validateSignUpRequest(payload);
    const userInDatabase = await userProfileRepository.findUserWithEmailId(
      useremail
    );

    if (userInDatabase) {
      logger.error("User already exists", { useremail });
      throw new ValidationError("User Already Exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newTempSignedUser = {
      username,
      password: hashedPassword,
      phoneNumber,
      emailId: useremail,
      userId: tempUserId,
    };

    await tempUserSignUpRepository.createUniqueUserWithEmailId(
      newTempSignedUser
    );
    const otp = generateOTP();
    await sendOTP(username, useremail, otp, true);
    logger.info(
      `Successfully sent otp=${otp} for user with userId=${tempUserId}, emailId=${useremail}`
    );
    await otpRepository.create(tempUserId, otp);
    const token = generateToken(
      tempUserId,
      process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW
    );
    return token;
  } catch (error) {
    logger.error(`Failed to update user profile with error=${error}`);
    throw error;
  }
}

async function verifyOtp(newUser, userOtp, isSignUpRequest) {
  try {
    const userId = newUser.userId;
    const originalOtp = await otpRepository.findOtpWithUserId(userId);

    if (!originalOtp || originalOtp.otp != userOtp) {
      throw new ValidationError("Otp Verification Failed");
    }

    if (!isSignUpRequest) {
      return;
    }

    const newUserObj = newUser.toObject();
    delete newUserObj._id;
    const createdUser = await userProfileRepository.create(newUserObj);
    logger.info(`Created user in permanent database, user=${createdUser}`);
  } catch (error) {
    logger.error(
      `Failed to verify otp for user with user=${newUser}, error=${error}`
    );
    throw error;
  }
}

async function login(payload) {
  try {
    const { useremail, password, rememberMe } = payload;

    authValidator.validateLoginRequest(payload);

    const userInDatabase = await userProfileRepository.findUserWithEmailId(
      useremail
    );

    if (!userInDatabase) {
      throw new ValidationError(`User not found with emailId=${useremail}`);
    }

    const userId = userInDatabase.userId;
    const storedHashPassword = userInDatabase.password;
    const resultOfComparison = await bcrypt.compare(
      password,
      storedHashPassword
    );

    if (!resultOfComparison) {
      throw new ValidationError(
        `User entered the wrong password, userId=${userId}, emailId=${useremail}`
      );
    }

    const expiresIn = rememberMe
      ? process.env.JWT_TOKEN_REMEMBER_ME_EXPIRE_TIME
      : process.env.JWT_TOKEN_DEFAULT_EXPIRE_TIME;

    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_USER_LOGIN,
      expiresIn
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to verify otp for user with payload=${JSON.stringify(
        payload
      )}, error=${error}`
    );
    throw error;
  }
}

async function forgotPassword(useremail) {
  try {
    authValidator.validateForgotPasswordRequest(useremail);
    const userInDatabase = await userProfileRepository.findUserWithEmailId(
      useremail
    );

    if (!userInDatabase) {
      throw new ValidationError("User Doesn't Exists");
    }
    const userId = userInDatabase.userId;
    const otp = generateOTP();
    logger.info(`Generated OTP for user with userId=${userId}, otp=${otp}`);
    await sendOTP(userInDatabase.username, useremail, otp, true);
    await otpRepository.create(userId, otp);
    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW
    );
    return token;
  } catch (error) {
    logger.error(
      `Error occured in forgot password flow for user with emailId=${useremail}, error=${error}`
    );
    throw error;
  }
}

async function resendOtp(username, useremail, userId) {
  try {
    const otp = generateOTP();
    await sendOTP(username, useremail, otp, false);
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

async function resetPassword(userId, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateData = { password: hashedPassword };
    await userProfileRepository.updateUser(userId, updateData);
  } catch (error) {
    logger.error(
      `Failed to update password of user with userId=${userId}, error=${error}`
    );
    throw error;
  }
}

module.exports = {
  signUp,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  googleLogin,
};
