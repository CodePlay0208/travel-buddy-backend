const asyncHandler = require("express-async-handler");
const logger = require("../logger");
const { requestContext } = require("../middleware/RequestContextMiddleware");
const {
  API_STARTED,
  API_SUCCESS,
  API_FAILED,
  DELETE_TRIP,
  CREATE_TRIP,
  GET_TRIP_BY_ID,
  EDIT_TRIP,
  GET_TRIPS_WITH_FILTERS,
  GET_TRIPS_BY_USER,
  GENERATE_TRIP_LINK,
  JOIN_TRIP,
  GET_WISHLISTED_TRIPS,
  ADD_WISHLIST_TRIP,
  REMOVE_WISHLIST_TRIP,
} = require("../constants/ApiConstants");
const tripDataService = require("../service/TripDataService");
const { ValidationError } = require("../exceptions/ValidationError");

const createTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${CREATE_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const user = req.user;
    const { files } = req;
    const payload = req.body;

    const { createdTrip, allObjectsUploaded } =
      await tripDataService.createTrip(payload, files, user);
    res.status(201).json({ createdTrip, allFilesUploaded: allObjectsUploaded });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${CREATE_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
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
      }ms`
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
    const { trips, newOffset } = await tripDataService.getTripsByUser(
      filter,
      userId
    );
    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_TRIPS_BY_USER}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
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

    const { trips, newOffset } = await tripDataService.getTripsWithFilter(
      filter,
      userId
    );

    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_TRIPS_WITH_FILTERS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
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
    const { updatedTrip, allObjectsUploaded } = await tripDataService.editTrip(
      tripId,
      userId,
      newPayload,
      newDestinationImages
    );

    res.status(200).json({ updatedTrip, allFilesUploaded: allObjectsUploaded });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${EDIT_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
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
      }ms`
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


const joinTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${JOIN_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const trip = req.trip;
    const user = req.user;

    const updatedTrip = await tripDataService.joinTrip(trip, user);
    res.status(200).json({ updatedTrip });

    const endTime = Date.now();
    logger.info(
      `API_NAME=${JOIN_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${JOIN_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getWishlistedTripsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_WISHLISTED_TRIPS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.user.userId;
    const filter = req.query;
    const { trips, newOffset } = await tripDataService.getWishlistedTrips(
      filter,
      userId
    );
    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_WISHLISTED_TRIPS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_WISHLISTED_TRIPS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const addWishlistTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADD_WISHLIST_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const tripId = req.params.tripId;
    const userId = req.user.userId;

    await tripDataService.addWishlistTrip(tripId, userId);
    res.status(200).json({});

    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADD_WISHLIST_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADD_WISHLIST_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const removeWishlistedTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${REMOVE_WISHLIST_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const tripId = req.params.tripId;
    const userId = req.user.userId;

    await tripDataService.removeWishlistedTrip(tripId, userId);
    res.status(200).json();

    const endTime = Date.now();
    logger.info(
      `API_NAME=${REMOVE_WISHLIST_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${REMOVE_WISHLIST_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const addMembersToTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADD_MEMBERS_TO_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const trip = req.trip;
    const user = req.user;
    const { userIds } = req.body;
    const updatedTrip = await tripDataService.addMembersToTrip(trip, user, userIds);
    res.status(200).json({ updatedTrip });

    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADD_MEMBERS_TO_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADD_MEMBERS_TO_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
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
  generateTripLinkHandler,
  joinTripHandler,
  getWishlistedTripsHandler,
  addWishlistTripHandler,
  removeWishlistedTripHandler,
  addMembersToTripHandler,
};
