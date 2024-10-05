const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/GenerateToken");
const logger = require("../Logger");
const { v4: uuidv4 } = require("uuid");
const {
  GOOGLE_LOGIN,
  LOGIN,
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  SIGN_UP,
  OTP_VERIFICATION,
  RESEND_OTP,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
} = require("../constants/ApiConstants");
const { requestContext } = require("../middleware/RequestContextMiddleware");

const authService = require("../service/AuthService");
const { ValidationError } = require("../exceptions/ValidationError");

async function getUserDataFromGoogle(accessToken) {
  try {
    logger.info(`Requesting user data from Google`);
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
    logger.info(`Successfully fetched user data=${data} from google`);
    return data;
  } catch (error) {
    logger.error(`Failed to fetch user data from google with error=${error}`);
    throw error;
  }
}

const googleLoginHandler = asyncHandler(async (req, res) => {
  try {
    const startTime = Date.now();
    const REQUEST_TID = req.additionalHeaders.requestTid;
    logger.info(
      `Request recieved for API_NAME=${GOOGLE_LOGIN}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { googleToken } = req.googleToken;
    const userData = await getUserDataFromGoogle(googleToken);
    const { emailAddresses, names } = userData;

    const userEmail = emailAddresses[0].value;
    const username = names[0].displayName;
    let userInDatabase = await UserProfile.findOne({ emailId: userEmail });

    if (!userInDatabase) {
      const userId = uuidv4();
      const newUserProfile = new UserProfile({
        username: username,
        emailId: userEmail,
        userId,
      });
      userInDatabase = await newUserProfile.save();
    }
    const currentUserId = userInDatabase.userId;
    res.status(200).json({
      token: generateToken(
        currentUserId,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      ),
    });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GOOGLE_LOGIN}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.info(
      `API_NAME=${GOOGLE_LOGIN}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

const signUpHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${SIGN_UP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    

    const token = await authService.signUp(
    req.body
    );

    res.status(201).json({
      token,
    });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${SIGN_UP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${SIGN_UP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const otpVerificationHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${OTP_VERIFICATION}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const user = req.user;
    const { userOtp } = req.body;
    const { isSignUpRequest } = req.body;
    await authService.verifyOtp(user, userOtp, isSignUpRequest);
    res.status(200).json({
      token: generateToken(
        user.userId,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      ),
    });

    const endTime = Date.now();
    logger.info(
      `API_NAME=${OTP_VERIFICATION}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${OTP_VERIFICATION}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const loginHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${LOGIN}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const token = await authService.login(req.body);
    res.status(200).json({ token });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${LOGIN}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${LOGIN}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${FORGOT_PASSWORD}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { useremail } = req.body;
    const token = await authService.forgotPassword(useremail);
    res.status(200).json({token});
    const endTime = Date.now();
    logger.info(
      `API_NAME=${FORGOT_PASSWORD}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${FORGOT_PASSWORD}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const resetPasswordHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${RESET_PASSWORD}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { newPassword } = req.body;
    const userId = req.user.userId;
    await authService.resetPassword(userId, newPassword);
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${RESET_PASSWORD}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${RESET_PASSWORD}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

const resendOtpHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${RESEND_OTP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { username, emailId, userId } = req.user;
    await authService.resendOtp(username, emailId, userId);
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${RESEND_OTP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${RESEND_OTP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

module.exports = {
  googleLoginHandler,
  signUpHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  otpVerificationHandler,
  resendOtpHandler,
};
