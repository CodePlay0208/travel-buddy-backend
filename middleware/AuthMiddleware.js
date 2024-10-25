const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const logger = require("../Logger");
const userProfileRepository = require("../repositories/UserProfileRepository");
const tempUserSignUpRepository = require("../repositories/TempUserSignUpRepository");
const tripRepository = require("../repositories/TripRepository");

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

        const user = await userProfileRepository.findUserByUserId(decoded.id);

        if (!user) {
          logger.info(`User not found with userId=${decoded.id}`);
          res.status(401).json();
        }
        req.user = user;
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

const tripTokenProtect = (jwtSecretKey) => {
  return asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.triptoken && req.headers.triptoken.startsWith("Bearer")) {
      try {
        token = req.headers.triptoken.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecretKey);

        const trip = await tripRepository.findTripWithTripId(decoded.id);

        if (!trip) {
          logger.info(`trip not found with tripId=${decoded.id}`);
          res.status(404).json();
        }

        req.trip = trip;
        next();
      } catch (error) {
        logger.error(`Error in trip authorization middleware, error=${error}`);
        res.status(401).json();
      }
    } else {
      logger.error(`No bearer token found in request headers`);
      res.status(401).json();
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

        if (isSignUpRequest == null || isSignUpRequest == undefined) {
          logger.error(`isSignUpRequest param is null or undefined`);
          return res.status(400).json();
        }

        let user = null;

        if (isSignUpRequest) {
          user = await tempUserSignUpRepository.findUserByUserId(decoded.id);
        } else {
          user = await userProfileRepository.findUserByUserId(decoded.id);
        }

        if (!user) {
          return res.status(400).json();
        }

        req.user = user;
        logger.info(`Authorized User for temp flows with userId=${decoded.id}`);
        next();
      } catch (error) {
        logger.error(
          `Error in authorization middleware for temp flows, error=${error}`
        );
        res.status(401).json();
      }
    } else {
      logger.error(`No bearer token found in request headers for temp flows`);
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

      const user = await userProfileRepository.findUserByUserId(decoded.id);

      if (!user) {
        throw new Error(
          `User not valid while decoding token with userId=${decoded.id}`
        );
      }
      req.user = user;
      logger.info(`Token decoded successfully with userId=${decoded.id}`);
    } catch (error) {
      logger.error(`Error while decoding token, error=${error}`);
    }
  }
  next();
});

module.exports = {
  tokenProtect,
  googleTokenProtect,
  jwtTokenDecoder,
  tokenProtectForTempFlows,
  tripTokenProtect,
};
