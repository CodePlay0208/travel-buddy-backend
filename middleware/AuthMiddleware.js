const jwt = require("jsonwebtoken");
const UserProfile = require("../models/UserProfileModel");
const TempUserSignUp = require("../models/TempUserSignUpModel");
const asyncHandler = require("express-async-handler");
const logger = require("../logger"); // Import the logger

const tokenProtect = (jwtSecretKey) => {
  return asyncHandler(async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecretKey);

        req.user = await UserProfile.findById(decoded.id);

        logger.info("Middleware passed", { userId: decoded.id });
        next();
      } catch (error) {
        logger.error("Error in tokenProtect middleware", {
          error: error.message,
          stack: error.stack,
        });
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      logger.warn("No token found in request headers");
      res.status(401).json({ message: "Unauthorized" });
    }
  });
};

const tokenProtectForTempFlows = (jwtSecretKey) => {
  return asyncHandler(async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecretKey);

        const { isSignUpRequest } = req.body;

        if(isSignUpRequest == null){
          return res.status(400);
        }

        if (isSignUpRequest) {
          req.user = await TempUserSignUp.findById(decoded.id);
        } else {
          req.user = await UserProfile.findById(decoded.id);
        }

        logger.info("Middleware passed", { userId: decoded.id });
        next();
      } catch (error) {
        logger.error("Error in tokenProtect middleware", {
          error: error.message,
          stack: error.stack,
        });
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      logger.warn("No token found in request headers");
      res.status(401).json({ message: "Unauthorized" });
    }
  });
};

const googleTokenProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.googleToken && req.headers.googleToken.startsWith("Bearer")) {
    try {
      req.googleToken = req.headers.googleToken.split(" ")[1];
      next();
    } catch (error) {
      logger.error("Error in googleTokenProtect middleware", {
        error: error.message,
        stack: error.stack,
      });
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    logger.warn("No Google token found in request headers");
    res.status(401).json({ message: "Unauthorized" });
  }
});

const jwtTokenDecoder = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      );

      req.user = await UserProfile.findById(decoded.id);
      logger.info("Token decoded successfully", { userId: decoded.id });
    } catch (error) {
      logger.error("Error while decoding token", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  next();
});

module.exports = {
  tokenProtect,
  googleTokenProtect,
  jwtTokenDecoder,
  tokenProtectForTempFlows,
};
