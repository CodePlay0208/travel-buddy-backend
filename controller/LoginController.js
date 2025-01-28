const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/GenerateToken");
const logger = require("../logger");
const { v4: uuidv4 } = require("uuid");
const {
  GOOGLE_LOGIN,
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  OTP_VERIFICATION,
  RESEND_OTP,
  LOGIN,
  SIGN_UP
} = require("../constants/ApiConstants");
const { requestContext } = require("../middleware/RequestContextMiddleware");

const authService = require("../service/AuthService");
const { ValidationError } = require("../exceptions/ValidationError");

const googleLoginHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GOOGLE_LOGIN}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const googleToken = req.googleToken;
    const token = await authService.googleLogin(googleToken);

    res.status(200).json({ token });

    const endTime = Date.now();
    logger.info(
      `API_NAME=${GOOGLE_LOGIN}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
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

    const token = await authService.signUp(req.body);

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

const sendOtpHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${LOGIN}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
 
    const { userKey } = req.body;
    const token = await authService.sendOtp(userKey);
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

const verifyOtpHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${OTP_VERIFICATION}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const token = await authService.verifyOtp(req.user, req.body.userOtp);
    res.status(200).json({ token });
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

const resendOtpHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${RESEND_OTP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { username, userId } = req.user;
    const {userKey} = req.body;
    await authService.resendOtp(username, userKey, userId);
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
  verifyOtpHandler,
  sendOtpHandler,
  resendOtpHandler,
};
