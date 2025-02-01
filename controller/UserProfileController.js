const asyncHandler = require("express-async-handler");
const logger = require("../logger");
const userProfileService = require("../service/UserProfileService");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  GET_USER_PROFILE,
  EDIT_USER_PROFILE,
  DELETE_USER_PROFILE,
  FIND_USER_PROFILE,
} = require("../constants/ApiConstants");
const { requestContext } = require("../middleware/RequestContextMiddleware");

const getUserProfileHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_USER_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const user = await userProfileService.getUserProfile(req.userId);
    res.status(200).json(user);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_USER_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_USER_PROFILE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

const editUserHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${EDIT_USER_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const userId = req.userId;
    const updateData = req.body;
    const { files } = req;
    const updatedUserProfile = await userProfileService.updateUserProfile(
      userId,
      updateData,
      files
    );

    const endTime = Date.now();
    logger.info(
      `API_NAME=${EDIT_USER_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
    res.status(200).json(updatedUserProfile);
  } catch (error) {
    logger.error(
      `API_NAME=${EDIT_USER_PROFILE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

const deleteUserHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${DELETE_USER_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    await userProfileService.deleteUserProfile(req.userId);

    const endTime = Date.now();
    logger.info(
      `API_NAME=${DELETE_USER_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
    res.status(200).json();
  } catch (error) {
    logger.error(
      `API_NAME=${DELETE_USER_PROFILE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

const findUserHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${FIND_USER_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const query = req.query
    await userProfileService.findUserProfile(query);

    const endTime = Date.now();
    logger.info(
      `API_NAME=${FIND_USER_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
    res.status(200).json();
  } catch (error) {
    logger.error(
      `API_NAME=${FIND_USER_PROFILE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

module.exports = { getUserProfileHandler, editUserHandler, deleteUserHandler, findUserHandler };
