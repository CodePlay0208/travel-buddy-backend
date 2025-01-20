const express = require("express");
const { jwtTokenDecoder } = require("../middleware/PartnersAuthMiddleware");
const {
  sendOtpHandler,
  loginHandler,
  setAgentDataHandler,
  getAgentDataHandler,
} = require("../controller/PartnersController");
const router = express.Router();

router.route("/sendOtp").post(sendOtpHandler);

router
  .route("/login")
  .post(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    loginHandler
  );

router
  .route("/agentData")
  .get(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    getAgentDataHandler
  );

router
  .route("/agentData")
  .post(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN),
    setAgentDataHandler
  );

module.exports = router;
