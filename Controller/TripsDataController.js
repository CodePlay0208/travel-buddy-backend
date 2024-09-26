const asyncHandler = require("express-async-handler");
const logger = require("../Logger");
const requestContext = require("../config/RequestContext");
const {
  DELETE_TRIP,
  CREATE_TRIP,
  GET_TRIP_BY_ID,
  EDIT_TRIP,
  GET_TRIPS_WITH_FILTERS,
  GET_TRIPS_BY_USER
} = require("../constants/ApiConstants");
const { ValidationError } = require("../exceptions/ValidationError");

const createTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${CREATE_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const userId = req.user.userId;
    const { files } = req;
    const payload = req.body;

    const allObjectsUploaded = await tripDataService.createTrip(
      payload,
      files,
      userId
    );
    res.status(201).json({ allFilesUploaded: allObjectsUploaded });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${CREATE_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${CREATE_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const getTripByIdHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_TRIP_BY_ID}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { tripId } = req.params;
    const trip = await tripDataService.getTripById(tripId);
    res.status(200).json(trip);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_TRIP_BY_ID}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_TRIP_BY_ID}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getTripsByUserHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_TRIPS_BY_USER}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.user.userId;
    const filter = req.query;
    const{ trips, newOffset} = await tripDataService.getTripsByFilter(filter, userId);
    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_TRIPS_BY_USER}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_TRIPS_BY_USER}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getTripsWithFilterHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_TRIPS_WITH_FILTERS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const filter = req.query;
    const userId = req?.user?.userId;

    const{ trips, newOffset} = await tripDataService.getTripsByFilter(filter, userId);

    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_TRIPS_WITH_FILTERS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_TRIPS_WITH_FILTERS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const editTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${EDIT_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { tripId } = req.params;
    const { userId } = req.user;
    const newPayload = req.body;
    const newDestinationImages = req.files;
    const allObjectsUploaded = await tripDataService.editTrip(
      tripId,
      userId,
      newPayload,
      newDestinationImages
    );
    
    res.status(200).json({ allFilesUploaded: allObjectsUploaded });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${EDIT_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (err) {
    logger.error(
      `API_NAME=${EDIT_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const deleteTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${DELETE_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const tripId = req.params.tripId;
    const userId = req.user.userId;

    await tripDataService.deleteTrip(tripId, userId);
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${DELETE_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${DELETE_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

module.exports = {
  createTripHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteTripHandler,
  getTripsWithFilterHandler,
};
  