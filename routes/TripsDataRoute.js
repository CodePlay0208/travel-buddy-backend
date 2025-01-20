const express = require("express");
const {
  tokenProtect,
  jwtTokenDecoder,
  tripTokenProtect,
} = require("../middleware/AuthMiddleware");
const {
  createTripHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteTripHandler,
  getTripsWithFilterHandler,
  joinTripHandler,
  getWishlistedTripsHandler,
  addWishlistTripHandler,
  removeWishlistedTripHandler,
  addMembersToTripHandler
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
router.route("/getTripById/:tripId").get(getTripByIdHandler);
router
  .route("/getTripsByUser")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getTripsByUserHandler
  );
router.route("/getTrips").get(jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), getTripsWithFilterHandler);
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
  .route("/joinTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    tripTokenProtect(process.env.SECRET_KEY_FOR_GENERATING_TRIP_LINK),
    joinTripHandler
  );

router
  .route("/getWishlistedTrips")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getWishlistedTripsHandler
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
  .route("/addMembersToTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    tripTokenProtect(process.env.SECRET_KEY_FOR_GENERATING_TRIP_LINK),
    addMembersToTripHandler
  );

module.exports = router;
