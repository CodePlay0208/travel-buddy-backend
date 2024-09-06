const express = require("express");
const {
  tokenProtect,
  googleTokenProtect,
  tokenProtectForTempFlows,
} = require("../middleware/AuthMiddleware");
const {
  googleLoginHandler,
  signUpHandler,
  loginHandler,
  forgotPasswordHandler,
  verifyResetPasswordHandler,
  otpVerificationHandler,
  resendOtpHandler,
} = require("../controller/LoginController");
const router = express.Router();

router.route("/googleLogin").get(googleTokenProtect, googleLoginHandler);
router.route("/signUp").post(signUpHandler);
router
  .route("/verifyOtp")
  .post(
    tokenProtectForTempFlows(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    otpVerificationHandler
  );
router.route("/login").post(loginHandler);
router.route("/forgotPassword").post(forgotPasswordHandler);
router
  .route("/verifyResetPassword")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    verifyResetPasswordHandler
  );
router
  .route("/resendOtp")
  .post(
    tokenProtectForTempFlows(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    resendOtpHandler
  );

module.exports = router;
