const asyncHandler = require("express-async-handler");
const logger = require("../logger");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  SEND_OTP_TO_PARTNERS,
  PARTNER_LOGIN,
  SET_AGENT_DATA,
  GET_AGENT_DATA,
  ADMIN_SCHEDULE_TRIPS,
  ADMIN_SETUP_PROFILE,
  ADMIN_PUBLISH_TRIP_IMAGES,
  ADMIN_PUBLISH_TRIP,
  ADMIN_PRESIGNED_URL_DESTINATION_IMAGES
} = require("../constants/ApiConstants");
const { requestContext } = require("../middleware/RequestContextMiddleware");
const partnersService = require("../service/PartnersService");
const { ValidationError } = require("../exceptions/ValidationError");

const sendOtpHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${SEND_OTP_TO_PARTNERS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const { useremail } = req.body;
    const token = await partnersService.sendOtp(useremail);
    res.status(200).json({ token });

    const endTime = Date.now();
    logger.info(
      `API_NAME=${SEND_OTP_TO_PARTNERS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${SEND_OTP_TO_PARTNERS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
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
      `Request recieved for API_NAME=${PARTNER_LOGIN}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { userotp } = req.body;
    const userId = req.userId;
    const token = await partnersService.login(userId, userotp);
    res.status(200).json({ token });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${PARTNER_LOGIN}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${PARTNER_LOGIN}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const setAgentDataHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${SET_AGENT_DATA}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    await partnersService.setAgentData(req.body, req.userId);
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${SET_AGENT_DATA}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
  `
    );
  } catch (error) {
    logger.error(
      `API_NAME=${SET_AGENT_DATA}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const getAgentDataHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_AGENT_DATA}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const agentsData = await partnersService.getAgentsData(req.userId);
    res.status(200).json({ agentsData });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_AGENT_DATA}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
  `
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_AGENT_DATA}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const scheduleTripsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADMIN_SCHEDULE_TRIPS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    await partnersService.scheduleTrips(req.userId);
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADMIN_SCHEDULE_TRIPS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
  `
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADMIN_SCHEDULE_TRIPS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const setupProfileHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADMIN_SETUP_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const updateData = req.body;
    const { files } = req;
    const updatedUserProfile = await partnersService.setupProfile(
      updateData,
      files,
      req.userId
    );
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADMIN_SETUP_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
  `
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADMIN_SETUP_PROFILE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const publishTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADMIN_PUBLISH_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const updateData = req.body;
    const baseTripId = await partnersService.publishTrip(
      updateData,
      req.userId
    );
    res.status(200).json({baseTripId});
    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADMIN_PUBLISH_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
  `
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADMIN_PUBLISH_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const generatePreSignedUrlHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADMIN_PRESIGNED_URL_DESTINATION_IMAGES}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;
    const payload = req.body;
    const signedUrls = await partnersService.generatePreSignedUrl(
      payload,
      userId
    );
    res.status(200).json(signedUrls);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADMIN_PRESIGNED_URL_DESTINATION_IMAGES}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADMIN_PRESIGNED_URL_DESTINATION_IMAGES}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getUserProfileHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADMIN_PRESIGNED_URL_DESTINATION_IMAGES}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;
    const payload = req.body;
    const userInDatabase = await partnersService.getUserProfile(
      payload,
      userId
    );
    res.status(200).json(userInDatabase);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADMIN_PRESIGNED_URL_DESTINATION_IMAGES}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADMIN_PRESIGNED_URL_DESTINATION_IMAGES}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

module.exports = {
  loginHandler,
  sendOtpHandler,
  getAgentDataHandler,
  setAgentDataHandler,
  scheduleTripsHandler,
  setupProfileHandler,
  publishTripHandler,
  generatePreSignedUrlHandler,
  getUserProfileHandler
};
