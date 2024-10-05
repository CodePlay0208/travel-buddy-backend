const asyncHandler = require("express-async-handler");
const chatService = require("../service/ChatService");
const logger = require("../Logger");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  FETCH_OR_CREATE_CHAT,
  GET_ALL_CHATS,
} = require("../constants/ApiConstants");
const { requestContext } = require("../middleware/RequestContextMiddleware");
const { ValidationError } = require("../exceptions/ValidationError");

const fetchOrCreateChatsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${FETCH_OR_CREATE_CHAT}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { receiverUserId } = req.body;
    const fetchedChat = await chatService.fetchOrCreateChats(
      receiverUserId,
      req.user
    );
    res.status(200).json(fetchedChat);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${FETCH_OR_CREATE_CHAT}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${FETCH_OR_CREATE_CHAT}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getChatsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_ALL_CHATS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.user.userId;
    const fetchedChats = await chatService.getChats(userId);
    res.status(200).send(fetchedChats);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_ALL_CHATS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_ALL_CHATS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    return res.status(500).json();
  }
});

module.exports = { fetchOrCreateChatsHandler, getChatsHandler };
