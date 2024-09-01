const jwt = require("jsonwebtoken");
const UserProfile = require("../models/UserProfileModel");
const TempUserSignUp = require("../models/TempUserSignUpModel");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("request came here");
      token = req.headers.authorization.split(" ")[1];
      const { isSignUpRequest } = req.body;
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      );

      if (isSignUpRequest) {
        req.user = await TempUserSignUp.findById(decoded.id);
      } else {
        req.user = await UserProfile.findById(decoded.id);
      }

      next();
    } catch (error) {
      res.status(401).json();
    }
  }

  if (!token) {
    res.status(401).json();
  }
});

const googleTokenProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.googleToken && req.headers.googleToken.startsWith("Bearer")) {
    try {
      req.googleToken = req.headers.googleToken.split(" ")[1];
      next();
    } catch (error) {
      res.status(401).json();
    }
  }

  if (!token) {
    res.status(401).json();
  }
});

const jwtTokenDecoder = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("request came here");
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      );

      req.user = await UserProfile.findById(decoded.id);

      next();
    } catch (error) {
      console.log("error while decoding token", error);
    }
  }
});

module.exports = { protect, googleTokenProtect, jwtTokenDecoder };
