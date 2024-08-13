const express = require("express");
const {protect} = require("../middleware/AuthMiddleware");
const { googleLoginHandler, isUserLoggedInHandler, signUpHandler,
    loginHandler, forgotPasswordHandler, verifyResetPasswordHandler, 
    otpVerificationHandler, resendOtpHandler } = require("../controller/LoginController");
const router = express.Router();

router.route("/googleLogin").post(googleLoginHandler);
router.route("/isUserLoggedIn").get(protect, isUserLoggedInHandler);
router.route("/signUp").post(signUpHandler);
router.route("/verifyOtp").get(protect, otpVerificationHandler)
router.route("/login").post(loginHandler);
router.route("/forgotPassword").post(forgotPasswordHandler);
router.route("/verifyResetPassword").post(protect, verifyResetPasswordHandler);
router.route("/resendOtp").post(protect, resendOtpHandler);

 
// logout -> just remove the token from local storage

module.exports = router;