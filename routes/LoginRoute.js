const express = require("express");
const {
  tokenProtect,
  googleTokenProtect,
} = require("../middleware/AuthMiddleware");
const {
  googleLoginHandler,
  signUpHandler,
  verifyOtpHandler,
  resendOtpHandler,
  sendOtpHandler,
} = require("../controller/LoginController");
const router = express.Router();

router.route("/googleLogin").post(googleTokenProtect, googleLoginHandler);
router.route("/signUp").post(signUpHandler);
router.route("/login").post(sendOtpHandler);
router
  .route("/verifyOtp")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    verifyOtpHandler
  );
router
  .route("/resendOtp")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    resendOtpHandler
  );

module.exports = router;
