const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const logger = require("../logger");


const tokenProtect = (jwtSecretKey) => {
  return asyncHandler(async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        logger.info(`Processing token authorization for request`);
        const decoded = jwt.verify(token, jwtSecretKey);

        req.userId = decoded.id;
        logger.info(`Successfully authorized user with userId=${decoded.id}`);
        next();
      } catch (error) {
        logger.error(`Failed to authorize token: error=${error.message}`);
        if (error.stack) {
          logger.error(`Stack trace: ${error.stack}`);
        }
        res.status(401).json();
      }
    } else {
      logger.error(`No bearer token found in request headers`);
      res.status(401).json();
    }
  });
};

const googleTokenProtect = asyncHandler(async (req, res, next) => {
  if (req.headers.googletoken && req.headers.googletoken.startsWith("Bearer")) {
    try {
      req.googleToken = req.headers.googletoken.split(" ")[1];
      logger.info(`Successfully authorized user for google auth`);
      next();
    } catch (error) {
      logger.error(`Failed to process google token: error=${error.message}`);
      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
      }
      res.status(401).json();
    }
  } else {
    logger.error(`No Google token found in request headers`);
    res.status(401).json();
  }
});

const jwtTokenDecoder = (jwtSecretKey) => {
  return asyncHandler(async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        logger.info(`Decoding JWT token`);
        const decoded = jwt.verify(
          token,
          jwtSecretKey
        );

        req.userId = decoded.id;
        logger.info(`Successfully decoded token with userId=${decoded.id}`);
      } catch (error) {
        logger.error(`Failed to decode token: error=${error.message}`);
        if (error.stack) {
          logger.error(`Stack trace: ${error.stack}`);
        }
      }
    }
    next();
  });
};

module.exports = {
  tokenProtect,
  googleTokenProtect,
  jwtTokenDecoder,
};
