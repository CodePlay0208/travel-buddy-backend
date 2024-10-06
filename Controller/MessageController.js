const asyncHandler = require("express-async-handler");
const logger = require("../Logger");
const messageService = require("../service/MessageService");
const { requestContext } = require("../middleware/RequestContextMiddleware");
const { ValidationError } = require("../exceptions/ValidationError");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  CREATE_NEW_MESSAGE,
  GET_ALL_MESSAGES,
} = require("../constants/ApiConstants");

const getAllMessagesForAChatHandler = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_ALL_MESSAGES}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const { messages, newOffset } = await messageService.getAllMessagesForAChat(
      userId,
      req.query
    );

    res.status(200).json({ messages, offset: newOffset });
    const endTime = Date.now();

    logger.info(
      `API_NAME=${GET_ALL_MESSAGES}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_ALL_MESSAGES}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const createNewMessageHandler = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  const userId = req.user.userId;
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${CREATE_NEW_MESSAGE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const message = await messageService.createNewMessage(
      chatId,
      content,
      userId
    );

    res.status(200).json(message);
    const endTime = Date.now();

    logger.info(
      `API_NAME=${CREATE_NEW_MESSAGE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${CREATE_NEW_MESSAGE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

module.exports = { getAllMessagesForAChatHandler, createNewMessageHandler };
