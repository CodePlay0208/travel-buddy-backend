const express = require("express");
const {
  tokenProtect,
  jwtTokenDecoder,
} = require("../middleware/AuthMiddleware");
const {
  createTripsHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteBaseTripHandler,
  deleteTripInstanceHandler,
  getTripsWithFilterHandler,
  joinRequestHandler,
  getWishlistedTripsHandler,
  addWishlistTripHandler,
  removeWishlistedTripHandler,
  addMemberToTripHandler,
  leaveTripHandler,
  getRequestedTripsHandler,
  getJoinedTripsHandler,
  removeMemberAsHostHandler,
  getRequestedMembersHandler,
  createTripsImagesHandler,
  declineRequestInvitationHandler,
  getRandomTripsHandler,
  generatePreSignedUrlHandler,
  testRouteHandler
} = require("../controller/TripsDataController");
const router = express.Router();
const { uploadMiddlewareForImages } = require("../middleware/UploadMiddleware");

router
  .route("/createTrips")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    createTripsHandler
  );

router
  .route("/createTripsImages")
  .post(
    createTripsImagesHandler
  );
router
  .route("/getTripById/:tripInstanceId")
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
  .route("/getRandomTrips")
  .get(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getRandomTripsHandler
  );
router
  .route("/editTrip/:baseTripId")
  .put(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    editTripHandler
  );

router
  .route("/deleteBaseTrip/:baseTripId")
  .delete(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    deleteBaseTripHandler
  );

router
  .route("/deleteTripInstance/:tripInstanceId")
  .delete(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    deleteTripInstanceHandler
  );

router
  .route("/getWishlistedTrips")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getWishlistedTripsHandler
  );

router
  .route("/addWishlistTrip/:tripInstanceId")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    addWishlistTripHandler
  );

router
  .route("/removeWishlistedTrip/:tripInstanceId")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    removeWishlistedTripHandler
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
  .route("/requestJoinTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    joinRequestHandler
  );

router
  .route("/addMemberTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    addMemberToTripHandler
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

router
  .route("/declineRequest")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    declineRequestInvitationHandler
  );

router.route("/getRequestedMembers").post(getRequestedMembersHandler);

router
  .route("/generatePreSignedUrlForDestinationImages")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    generatePreSignedUrlHandler
  );

  router
  .route("/testRoute")
  .post(
    uploadMiddlewareForImages.array('destinationImages'),
    testRouteHandler
  );

module.exports = router;
