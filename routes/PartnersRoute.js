const express = require("express");
const { tokenProtect } = require("../middleware/AuthMiddleware");
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
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
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

module.exports = router;
