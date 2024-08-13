const jwt = require("jsonwebtoken");
const UserProfile = require("../models/UserProfileModel");
const TempUserSignUp = require("../models/TempUserSignUpModel");
const asyncHandler = require("express-async-handler");
const OtpModel = require("../models/OtpModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const { isSignUpRequest } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN);

      if (isSignUpRequest) {
        req.user = await TempUserSignUp.findById(decoded.id);
      }

      else {
        req.user = await UserProfile.findById(decoded.id);
      }

      next();
    } catch (error) {
      res.status(401).json("token not valid");
    }
  }

  if (!token) {
    res.status(401).json("Not authorized, no token");
  }
});

module.exports = { protect };