const express = require("express");
const {
  tokenProtect,
  jwtTokenDecoder,
  tripTokenDecoder,
  tripTokenProtect,
} = require("../middleware/AuthMiddleware");
const {
  createTripHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteTripHandler,
  getTripsWithFilterHandler,
  generateTripLinkHandler,
  joinTripHandler,
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
router.route("/getTrips").get(jwtTokenDecoder, getTripsWithFilterHandler);
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
  .route("/generateTripLink/:tripId")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    generateTripLinkHandler
  );

router
  .route("/joinTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    tripTokenProtect(process.env.SECRET_KEY_FOR_GENERATING_TRIP_LINK),
    joinTripHandler
  );

module.exports = router;
