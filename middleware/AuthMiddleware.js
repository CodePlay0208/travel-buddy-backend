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
        const decoded = jwt.verify(token, jwtSecretKey);

        req.userId = decoded.id;
        logger.info(`Authorized User with userId=${decoded.id}`);
        next();
      } catch (error) {
        logger.error(`Error in authorization middleware, error=${error}`);
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
      logger.info(`Authorized user for google auth`);
      next();
    } catch (error) {
      logger.error(`Error in googleTokenProtect middleware, error=${error}`);
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
        const decoded = jwt.verify(
          token,
          jwtSecretKey
        );

        req.userId = decoded.id;
        logger.info(`Token decoded successfully with userId=${decoded.id}`);
      } catch (error) {
        logger.error(`Error while decoding token, error=${error}`);
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
