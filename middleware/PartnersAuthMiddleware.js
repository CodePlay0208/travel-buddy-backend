const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const logger = require("../logger");
const partnersProfileRepository = require("../repositories/PartnersProfileRepository");
const { ValidationError } = require("../exceptions/ValidationError");

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

        const user = await partnersProfileRepository.findUserByUserId(decoded.id);

        if (!user) {
          throw new ValidationError(
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
};

module.exports = {
  jwtTokenDecoder,
};
