const asyncHandler = require("express-async-handler");
const notificationService = require("../service/NotificationService");
const logger = require("../logger");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  GET_NOTIFICATION,
  DELETE_NOTIFICATION,
} = require("../constants/ApiConstants");
const { requestContext } = require("../middleware/RequestContextMiddleware");

const { ValidationError } = require("../exceptions/ValidationError");

const getNotificationsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_NOTIFICATION}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const userId = req.userId;

    const notifications = await notificationService.getNotification(userId);

    res.status(200).json(notifications);
    res.header();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_NOTIFICATION}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_NOTIFICATION}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const deleteNotificationHandler = asyncHandler(async (req, res) => {
    const REQUEST_TID = requestContext.getRequestTid();
    try {
      const startTime = Date.now();
      logger.info(
        `Request recieved for API_NAME=${DELETE_NOTIFICATION}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
      );
  
      const { notificationId } = req.body;
  
      await notificationService.deleteNotification(notificationId);
  
      res.status(200).json();
      res.header();
      const endTime = Date.now();
      logger.info(
        `API_NAME=${DELETE_NOTIFICATION}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
          endTime - startTime
        }ms
  `
      );
    } catch (error) {
      logger.error(
        `API_NAME=${DELETE_NOTIFICATION}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
      );
      if (error instanceof ValidationError) {
        res.status(400).json();
      } else {
        res.status(500).json();
      }
    }
  });

module.exports = { deleteNotificationHandler, get };
