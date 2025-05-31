const asyncHandler = require("express-async-handler");
const logger = require("../logger");
const { requestContext } = require("../middleware/RequestContextMiddleware");
const {
  API_STARTED,
  API_SUCCESS,
  API_FAILED,
  DELETE_BASE_TRIP,
  DELETE_TRIP_INSTANCE,
  CREATE_TRIP,
  GET_TRIP_BY_ID,
  EDIT_TRIP,
  GET_TRIPS_WITH_FILTERS,
  GET_TRIPS_BY_USER,
  REQUEST_JOIN_TRIP,
  GET_WISHLISTED_TRIPS,
  ADD_WISHLIST_TRIP,
  REMOVE_WISHLIST_TRIP,
  ADD_MEMBER_TO_TRIP,
  LEAVE_TRIP,
  GET_REQUESTED_TRIPS,
  REMOVE_MEMBER_AS_HOST,
  GET_JOINED_TRIPS,
  GET_REQUESTED_MEMBERS,
  CREATE_TRIPS_IMAGES,
  DECLINE_REQUEST_INVITATION,
  EDIT_TRIP_IMAGES
} = require("../constants/ApiConstants");
const tripDataService = require("../service/TripDataService");
const { ValidationError } = require("../exceptions/ValidationError");

const createTripsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${CREATE_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const user = req.userId;
    const payload = req.body;

    const baseTripId = await tripDataService.createTrip(payload, user);
    res.status(201).json({ baseTripId });
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

const createTripsImagesHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${CREATE_TRIPS_IMAGES}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const userId = req.userId;
    const { files } = req;
    const newPayload = req.body;

    await tripDataService.createTripsImages(newPayload, files, userId);
    res.status(201).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${CREATE_TRIPS_IMAGES}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${CREATE_TRIPS_IMAGES}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
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
    const { tripInstanceId } = req.params;
    const userId = req.userId;
    const trip = await tripDataService.getTripById(tripInstanceId, userId);
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
    const userId = req.userId;
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
    const userId = req?.userId;

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

const getRandomTripsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_RANDOM_TRIPS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const filter = req.query;
    const userId = req?.userId;

    const trips  = await tripDataService.getRandomTrips(
      filter,
      userId
    );

    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_RANDOM_TRIPS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_RANDOM_TRIPS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
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
    const { baseTripId } = req.params;
    const userId = req.userId;
    const newPayload = req.body;
    const newDestinationImages = req.files;
    const updatedTrip  = await tripDataService.editTrip(
      baseTripId,
      userId,
      newPayload,
      newDestinationImages
    );

    res.status(200).json(updatedTrip);
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

const editTripImagesHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${EDIT_TRIP_IMAGES}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const { baseTripId } = req.params;
    const userId = req.userId;
    const newPayload = req.body;
    const newDestinationImages = req.files;
    const { updatedTrip, allObjectsUploaded } = await tripDataService.editTripImages(
      baseTripId,
      userId,
      newPayload,
      newDestinationImages
    );

    res.status(200).json({ updatedTrip, allFilesUploaded: allObjectsUploaded });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${EDIT_TRIP_IMAGES}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${EDIT_TRIP_IMAGES}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const deleteBaseTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${DELETE_BASE_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const baseTripId = req.params.baseTripId;
    const userId = req.userId;

    await tripDataService.deleteBaseTrip(baseTripId, userId);
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${DELETE_BASE_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${DELETE_BASE_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const deleteTripInstanceHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${DELETE_TRIP_INSTANCE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const tripInstanceId = req.params.tripInstanceId;
    const userId = req.userId;

    await tripDataService.deleteTripInstance(tripInstanceId, userId);
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${DELETE_TRIP_INSTANCE}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${DELETE_TRIP_INSTANCE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
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
    const userId = req.userId;
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
    const tripInstanceId = req.params.tripInstanceId;
    const userId = req.userId;

    await tripDataService.addWishlistTrip(tripInstanceId, userId);
    res.status(200).json();

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
    const tripInstanceId = req.params.tripInstanceId;
    const userId = req.userId;

    await tripDataService.removeWishlistedTrip(tripInstanceId, userId);
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

const addMemberToTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${ADD_MEMBER_TO_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;

    await tripDataService.addMemberTrip(req.body, userId);
    res.status(200).json();

    const endTime = Date.now();
    logger.info(
      `API_NAME=${ADD_MEMBER_TO_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${ADD_MEMBER_TO_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const joinRequestHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${REQUEST_JOIN_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;

    await tripDataService.requestJoinTrip(req.body, userId);
    res.status(200).json();

    const endTime = Date.now();
    logger.info(
      `API_NAME=${REQUEST_JOIN_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${REQUEST_JOIN_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const leaveTripHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${LEAVE_TRIP}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;

    await tripDataService.leaveTrip(req.body, userId);
    res.status(200).json();

    const endTime = Date.now();
    logger.info(
      `API_NAME=${LEAVE_TRIP}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${LEAVE_TRIP}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getRequestedTripsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_REQUESTED_TRIPS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;
    const filter = req.query;
    const { trips, newOffset } = await tripDataService.getRequestedTrips(
      filter,
      userId
    );
    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_REQUESTED_TRIPS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_REQUESTED_TRIPS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getJoinedTripsHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_JOINED_TRIPS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;
    const filter = req.query;
    const { trips, newOffset } = await tripDataService.getJoinedTrips(
      filter,
      userId
    );
    res.status(200).json({ trips, offset: newOffset });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_JOINED_TRIPS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_JOINED_TRIPS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const removeMemberAsHostHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${REMOVE_MEMBER_AS_HOST}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;
    const filter = req.body;
    await tripDataService.removeMemberAsHost(
      filter,
      userId
    );
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${REMOVE_MEMBER_AS_HOST}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${REMOVE_MEMBER_AS_HOST}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const getRequestedMembersHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${GET_REQUESTED_MEMBERS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const {tripInstanceId} = req.body;
    const trip = await tripDataService.getRequestedMembers(
      tripInstanceId
    );
    res.status(200).json(trip);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${GET_REQUESTED_MEMBERS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${GET_REQUESTED_MEMBERS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

const declineRequestInvitationHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${DECLINE_REQUEST_INVITATION}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const userId = req.userId;
    const filter = req.body;
    await tripDataService.declineRequestInvitation(
      filter,
      userId
    );
    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${DECLINE_REQUEST_INVITATION}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${DECLINE_REQUEST_INVITATION}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(error.errorCode).json();
    } else {
      res.status(500).json();
    }
  }
});

module.exports = {
  createTripsHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteBaseTripHandler,
  deleteTripInstanceHandler,
  getTripsWithFilterHandler,
  getWishlistedTripsHandler,
  addWishlistTripHandler,
  removeWishlistedTripHandler,
  joinRequestHandler,
  addMemberToTripHandler,
  leaveTripHandler,
  getRequestedTripsHandler,
  getJoinedTripsHandler,
  removeMemberAsHostHandler,
  getRequestedMembersHandler,
  editTripImagesHandler,
  createTripsImagesHandler,
  declineRequestInvitationHandler,
  getRandomTripsHandler
};
