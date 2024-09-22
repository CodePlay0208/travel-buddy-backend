const requestContext = require("../config/requestContext");
const logger = require("../Logger");

const requestContextMiddleware = (req, res, next) => {
  try {
    const requestTid = req.headers["x-request-id"] || `tid-${Date.now()}`;
    logger.info(`Setting Context for tid=${requestTid}`);
    requestContext.setRequestTid(requestTid);
  } catch (error) {
    logger.error(`Failed Setting Context with error=${error}`);
  }
  next();
};

module.exports = requestContextMiddleware;
