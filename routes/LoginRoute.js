const express = require("express");
const {protect, googleTokenProtect} = require("../middleware/AuthMiddleware");
const { googleLoginHandler, signUpHandler,
    loginHandler, forgotPasswordHandler, verifyResetPasswordHandler, 
    signUpOtpVerificationHandler, resendOtpHandler } = require("../controller/LoginController");
const router = express.Router();

router.route("/googleLogin").get(googleTokenProtect , googleLoginHandler);
router.route("/signUp").post(signUpHandler);
router.route("/verifyOtp").post(protect, signUpOtpVerificationHandler)
router.route("/login").post(loginHandler);
router.route("/forgotPassword").post(forgotPasswordHandler);
router.route("/verifyResetPassword").post(protect, verifyResetPasswordHandler);
router.route("/resendOtp").post(protect, resendOtpHandler);

 
module.exports = router;