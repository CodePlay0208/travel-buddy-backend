const express = require("express");
const { tokenProtect } = require("../middleware/AuthMiddleware");
const {
  sendOtpHandler,
  loginHandler,
  setAgentDataHandler,
  getAgentDataHandler,
  scheduleTripsHandler,
  setupProfileHandler,
  publishTripHandler,
  publishImagesHandler,
} = require("../controller/PartnersController");
const router = express.Router();
const { uploadMiddlewareForImages } = require("../middleware/UploadMiddleware");

router.route("/sendOtp").post(sendOtpHandler);

router
  .route("/login")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    loginHandler
  );

router
  .route("/agentData")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    getAgentDataHandler
  );

router
  .route("/agentData")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    setAgentDataHandler
  );

router
  .route("/scheduleTrips")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    scheduleTripsHandler
  );

router
  .route("/setup")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    uploadMiddlewareForImages.array("profilePic"),
    setupProfileHandler
  );

router
  .route("/createTrip")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    publishTripHandler
  );

router
  .route("/createTripImages")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    uploadMiddlewareForImages.array("destinationImages"),
    publishImagesHandler
  );

module.exports = router;
