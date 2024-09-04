const bcrypt = require("bcrypt");
const UserProfile = require("../models/UserProfileModel");
const TempUserSignUp = require("../models/TempUserSignUpModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/GenerateToken");
const OtpSchema = require("../models/OtpModel");
const generateOtpEmail = require('../mailTemplates/otpMail/generateOtpEmail');
const logger = require('../logger'); // Import the logger

async function getUserDataFromGoogle(accessToken) {
  logger.info('getUserDataFromGoogle function started', { accessToken });

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
    logger.info('Successfully fetched user data', { data });
    return data;
  } catch (error) {
    logger.error('Failed to fetch user data', { error: error.message, stack: error.stack });
    throw error;
  }
}

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  logger.info('Generated OTP', { otp });
  return otp;
}

async function sendOTP(name, useremail, otp,status) {
  logger.info('sendOTP function started', { name, useremail, otp });

  try {
    const otpString = `${otp}`;
    const htmlContent = generateOtpEmail(name, useremail, otpString,status);

    const mailingData = {
      "sender": {  
        "name": "travmigoz",
        "email": process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS
      },
      "to": [  
        {
          "email": "akshat170902@gmail.com",
          "name": name
        }
      ],
      "subject": "Hello world",
      "htmlContent": htmlContent
    };

    const url = process.env.API_FOR_SENDING_MAILS;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": process.env.API_KEY_FOR_SENDING_MAILS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailingData)
    });

    const responseBody = await response.json();
    logger.info('OTP sent successfully', { response: responseBody });
  } catch (error) {
    logger.error('Error while sending OTP', { error: error.message, stack: error.stack });
    throw error;
  }
}

const googleLoginHandler = asyncHandler(async (req, res) => {
  logger.info('googleLoginHandler function started');

  try {
    const { googleToken } = req.googleToken;
    const userData = await getUserDataFromGoogle(googleToken);
    const { emailAddresses, names } = userData;

    const userEmail = emailAddresses[0].value;
    const username = names[0].displayName;
    let userInDatabase = await UserProfile.findOne({ emailId: userEmail });

    if (!userInDatabase) {
      const newUserProfile = new UserProfile({
        username: username,
        emailId: userEmail,
      });
      userInDatabase = await newUserProfile.save();
    }
    const currentUserId = userInDatabase._id;
    res.status(200).json({
      token: generateToken(currentUserId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    });
    logger.info('Google login successful', { userEmail, username });
  } catch (error) {
    logger.error('Google login failed', { error: error.message, stack: error.stack });
    res.status(500).json({});
  }
});

const signUpHandler = asyncHandler(async (req, res) => {
  logger.info('signUpHandler function started', { body: req.body });

  try {
    const { useremail, password, username, phoneNumber } = req.body;
    const userInDatabase = await UserProfile.findOne({ emailId: useremail });

    if (userInDatabase) {
      logger.warn('User already exists', { useremail });
      res.status(400).json();
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newTempSignedUser = new TempUserSignUp({
      username: username,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      emailId: useremail,
    });

    await TempUserSignUp.findOneAndDelete({ emailId: useremail });
    const createdUser = await newTempSignedUser.save();

    const otp = generateOTP();
    await sendOTP('akshat', useremail, otp,true);
    const newOTP = new OtpSchema({
      userId: createdUser._id,
      otp: otp,
    });
    await newOTP.save();

    res.status(201).json({
      token: generateToken(createdUser._id, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    });
    logger.info('User signed up successfully', { useremail });
  } catch (error) {
    logger.error('Error during signup', { error: error.message, stack: error.stack });
    res.status(500).json();
  }
});

const signUpOtpVerificationHandler = asyncHandler(async (req, res) => {
  logger.info('signUpOtpVerificationHandler function started', { userId: req.user._id });

  try {
    const userId = req.user._id;
    const { userOtp } = req.body;
    const originalOtp = await OtpSchema.findOne({ userId: userId }).sort({ createdAt: -1 });

    if (originalOtp && originalOtp.otp == userOtp) {
      const { isSignUpRequest } = req.body;
      if (isSignUpRequest) {
        const newUser = { ...req.user._doc };
        delete newUser._id;
        const saveUserInPermanentDatabase = new UserProfile(newUser);
        await saveUserInPermanentDatabase.save();
      }
      res.status(200).json();
      logger.info('OTP verification successful', { userId });
    } else {
      logger.warn('OTP verification failed', { userId, userOtp });
      res.status(400).json();
    }
  } catch (error) {
    logger.error('Error while verifying OTP', { error: error.message, stack: error.stack });
    res.status(500).json();
  }
});

const loginHandler = asyncHandler(async (req, res) => {
  logger.info('loginHandler function started', { body: req.body });

  try {
    const { userEmail, password, rememberMe } = req.body;
    const userInDatabase = await UserProfile.findOne({ emailId: userEmail });

    if (!userInDatabase) {
      logger.warn('User not found', { userEmail });
      res.status(400).json();
      return;
    }
    const storedHashPassword = userInDatabase.password;
    const userId = userInDatabase._id;
    const resultOfComparison = await bcrypt.compare(password, storedHashPassword);

    if (resultOfComparison) {
      let token = null;
      if (rememberMe) {
        token = generateToken(userId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN, "30d");
      } else {
        token = generateToken(userId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN);
      }
      res.status(200).json({ token: token });
      logger.info('Login successful', { userEmail });
    } else {
      logger.warn('Password mismatch', { userEmail });
      res.status(400).json();
    }
  } catch (error) {
    logger.error('Login failed', { error: error.message, stack: error.stack });
    res.status(500).json();
  }
});

const forgotPasswordHandler = asyncHandler(async (req, res) => {
  logger.info('forgotPasswordHandler function started', { body: req.body });

  try {
    const { userEmail } = req.body;
    const userInDatabase = await UserProfile.findOne({ emailId: userEmail });
    if (!userInDatabase) {
      logger.warn('User not found for password reset', { userEmail });
      res.status(400).json();
      return;
    }
    const otp = generateOTP();
    await sendOTP('akshat', userEmail, otp,false);
    const newOTP = new OtpSchema({
      userId: userInDatabase._id,
      otp: otp,
    });
    await newOTP.save();
    res.status(200).json({
      token: generateToken(userInDatabase._id, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    });
    logger.info('Forgot password OTP sent successfully', { userEmail });
  } catch (error) {
    logger.error('Error while handling forgot password', { error: error.message, stack: error.stack });
    res.status(500).json();
  }
});

const verifyResetPasswordHandler = asyncHandler(async (req, res) => {
  logger.info('verifyResetPasswordHandler function started', { userId: req.user._id });

  try {
    const { newPassword } = req.body;
    const userId = req.user._id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const newUser = await UserProfile.findOneAndUpdate(
      { _id: userId },
      { $set: { password: hashedPassword } },
      { new: true }
    );
    res.status(200).json();
    logger.info('Password reset successfully', { userId });
  } catch (error) {
    logger.error('Error while resetting password', { error: error.message, stack: error.stack });
    res.status(500).json();
  }
});

const resendOtpHandler = asyncHandler(async (req, res) => {
  logger.info('resendOtpHandler function started', { userId: req.user._id });

  try {
    const otp = generateOTP();
    await sendOTP('akshat',req.user.emailId, otp,false);
    const newOTP = new OtpSchema({
      userId: req.user._id,
      otp: otp,
    });
    await newOTP.save();
    res.status(200).json();
    logger.info('OTP resent successfully', { userId: req.user._id });
  } catch (error) {
    logger.error('Error while resending OTP', { error: error.message, stack: error.stack });
    res.status(500).json();
  }
});

module.exports = {
  googleLoginHandler,
  signUpHandler,
  loginHandler,
  forgotPasswordHandler,
  verifyResetPasswordHandler,
  signUpOtpVerificationHandler,
  resendOtpHandler,
};
