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
  loginHandler,
} = require("../controller/LoginController");
const router = express.Router();

router.route("/googleLogin").post(googleTokenProtect, googleLoginHandler);
router.route("/signUp").post(signUpHandler);
router.route("/login").post(loginHandler);
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
