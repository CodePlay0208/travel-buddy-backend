const express = require("express");
const { jwtTokenDecoder } = require("../middleware/PartnersAuthMiddleware");
const {
  sendOtpHandler,
  loginHandler
} = require("../controller/PartnersController");
const router = express.Router();

router
  .route("/sendOtp")
  .post(
    sendOtpHandler
  );

router
  .route("/login")
  .get(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    loginHandler
  );

module.exports = router;
