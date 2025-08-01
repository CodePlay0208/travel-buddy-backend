const logger = require("../logger");
const { AsyncLocalStorage } = require("async_hooks");
const asyncLocalStorage = new AsyncLocalStorage();

const requestContextMiddleware = (req, res, next) => {
  try {
    const requestTid = req.headers["x-request-id"] || generateTid();
    logger.info(`Setting request context for tid=${requestTid}`);
    asyncLocalStorage.run(new Map(), () => {
      requestContext.setRequestTid(requestTid);
      res.setHeader("x-request-id", requestTid);
      logger.info(`Successfully set request context for tid=${requestTid}`);
      next();
    });
  } catch (error) {
    logger.error(`Failed to set request context: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    next();
  }
};

const requestContext = {
  setRequestTid: (tid) => {
    try {
      const store = asyncLocalStorage.getStore();
      if (store) {
        logger.debug(`Setting requestTid=${tid} in context`);
        store.set("requestTid", tid);
      } else {
        logger.warn(`No active context to set tid=${tid}`);
      }
    } catch (error) {
      logger.error(`Failed to set tid to context: tid=${tid}, error=${error.message}`);
      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
      }
    }
  },

  getRequestTid: () => {
    try {
      const store = asyncLocalStorage.getStore();
      if (store) {
        const tid = store.get("requestTid");
        logger.debug(`Retrieved requestTid=${tid} from context`);
        return tid;
      }
      logger.warn(`No active context to get tid`);
      return null;
    } catch (error) {
      logger.error(`Failed to get tid from context: error=${error.message}`);
      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
      }
    }
  },
};

const generateTid = () => {
  const timestamp = Date.now().toString(36);
  const tid = `${Math.random().toString(36).substring(2, 17)}${timestamp}`;
  logger.debug(`Generated new tid=${tid}`);
  return tid;
};

module.exports = { requestContextMiddleware, requestContext };
