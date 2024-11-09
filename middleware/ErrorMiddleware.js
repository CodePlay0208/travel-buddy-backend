const logger = require("../logger");

const notFound = (req, res, next) => {
  logger.info(`Not found - ${req.originalUrl}`);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logger.error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.errorCode ? error.errorCode : 500;

  logger.error(`Error occurred before routing, error=${error}`);

  res.status(statusCode);
  res.json(error.message);
};

module.exports = { notFound, errorHandler };
