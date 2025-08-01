const logger = require("../logger");

const notFound = (req, res, next) => {
  logger.info(`Route not found: ${req.method} ${req.originalUrl}`);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logger.error(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.errorCode ? error.errorCode : 500;

  logger.error(`Global error handler: statusCode=${statusCode}, error=${error.message}`);
  if (error.stack) {
    logger.error(`Stack trace: ${error.stack}`);
  }

  res.status(statusCode);
  res.json(error.message);
};

module.exports = { notFound, errorHandler };
