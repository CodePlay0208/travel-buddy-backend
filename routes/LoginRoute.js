// const express = require("express");
// const {
//   tokenProtect,
//   googleTokenProtect,
//   tokenProtectForTempFlows,
// } = require("../middleware/AuthMiddleware");
// const {
//   googleLoginHandler,
//   signUpHandler,
//   loginHandler,
//   forgotPasswordHandler,
//   resetPasswordHandler,
//   otpVerificationHandler,
//   resendOtpHandler,
// } = require("../controller/LoginController");
// const router = express.Router();

// router.route("/googleLogin").post(googleTokenProtect, googleLoginHandler);
// router.route("/signUp").post(signUpHandler);
// router
//   .route("/verifyOtp")
//   .post(
//     tokenProtectForTempFlows(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
//     otpVerificationHandler
//   );
// router.route("/login").post(loginHandler);
// router.route("/forgotPassword").post(forgotPasswordHandler);
// router
//   .route("/resetPassword")
//   .post(
//     tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
//     resetPasswordHandler
//   );
// router
//   .route("/resendOtp")
//   .post(
//     tokenProtectForTempFlows(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
//     resendOtpHandler
//   );

// module.exports = router;
