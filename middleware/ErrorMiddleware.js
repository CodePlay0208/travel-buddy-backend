const logger = require("../Logger"); 

const notFound = (req, res, next) => {
  logger.info(`Not found - ${req.originalUrl}`);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logger.error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

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
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
};

module.exports = { notFound, errorHandler };
