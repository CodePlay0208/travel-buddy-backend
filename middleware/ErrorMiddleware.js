const logger = require("../logger"); // Import the logger

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logger.error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log the error details
  logger.error("Unhandled Error", {
    message: err.message,
    stack: err.stack,
    statusCode: statusCode,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack, // Hide stack trace in production
  });
};

module.exports = { notFound, errorHandler };
