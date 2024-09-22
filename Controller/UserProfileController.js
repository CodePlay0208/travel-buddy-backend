const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");
const DeletedUser = require("../models/DeletedUserModel");
const TripData = require("../models/TripDataModel");
const logger = require("../Logger");
const userProfileService = require("../service/UserProfileService");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  GET_USER_PROFILE,
  EDIT_USER_PROFILE,
  DELETE_USER_PROFILE,
} = require("../constants/ApiConstants");

const getUserProfileHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_USER_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    res.status(200).json({
      name: req.user.username,
      emailId: req.user.emailId,
      phoneNumber: req.user.phoneNumber,
      profilePic: req.user.profilePic,
    });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_USER_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_USER_PROFILE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

const editUserHandler = asyncHandler(async (req, res) => {
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${EDIT_USER_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const userId = req.user.userId;
    const updateData = req.body;

    const updatedUserProfile = await userProfileService.updateUserProfile(
      userId,
      updateData
    );

    const endTime = Date.now();
    logger.info(
      `API_NAME=${EDIT_USER_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
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
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${DELETE_USER_PROFILE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const userId = req.user.userId;
    const username = req.user.username;
    const emailId = req.user.emailId;

    logger.info(`Request to delete user profile for user ID: ${userId}`);

    await userProfileService.deleteUserProfile(userId, username, emailId);

    const endTime = Date.now();
    logger.info(
      `API_NAME=${DELETE_USER_PROFILE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
    res.status(200).json();
  } catch (error) {
    logger.error(
      `API_NAME=${DELETE_USER_PROFILE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

module.exports = { getUserProfileHandler, editUserHandler, deleteUserHandler };
