const express = require("express");
const {
  tokenProtect,
  jwtTokenDecoder,
} = require("../middleware/AuthMiddleware");
const {
  createTripHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteTripHandler,
  getTripsWithFilterHandler,
  joinRequestHandler,
  getWishlistedTripsHandler,
  addWishlistTripHandler,
  removeWishlistedTripHandler,
  addMemberToTripHandler,
  leaveTripHandler,
  getRequestedTripsHandler,
  getJoinedTripsHandler,
} = require("../controller/TripsDataController");
const router = express.Router();
const { uploadMiddlewareForImages } = require("../middleware/UploadMiddleware");

router
  .route("/createTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    uploadMiddlewareForImages.array("destinationImages"),
    createTripHandler
  );
router
  .route("/getTripById/:tripId")
  .get(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getTripByIdHandler
  );
router
  .route("/getTripsByUser")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getTripsByUserHandler
  );
router
  .route("/getTrips")
  .get(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getTripsWithFilterHandler
  );
router
  .route("/editTrip/:tripId")
  .put(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    uploadMiddlewareForImages.array("destinationImages"),
    editTripHandler
  );
router
  .route("/deleteTrip/:tripId")
  .delete(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    deleteTripHandler
  );

router
  .route("/getWishlistedTrips")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getWishlistedTripsHandler
  );

router
  .route("/getRequestedTrips")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getRequestedTripsHandler
  );

router
  .route("/getJoinedTrips")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getJoinedTripsHandler
  );

router
  .route("/addWishlistTrip/:tripId")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    addWishlistTripHandler
  );

router
  .route("/removeWishlistedTrip/:tripId")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    removeWishlistedTripHandler
  );

router
  .route("/requestJoinTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    addMemberToTripHandler
  );

router
  .route("/addMemberTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    joinRequestHandler
  );

router
  .route("/leaveTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    leaveTripHandler
  );

router
  .route("/removeMemberAsHost")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    removeMemberAsHostHandler
  );

module.exports = router;
