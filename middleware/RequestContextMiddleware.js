const logger = require("../Logger");
const { AsyncLocalStorage } = require("async_hooks");
const asyncLocalStorage = new AsyncLocalStorage();

const requestContextMiddleware = (req, res, next) => {
  try {
    const requestTid = req.headers["x-request-id"] || generateTid();
    logger.info(`Setting Context for tid=${requestTid}`);
    asyncLocalStorage.run(new Map(), () => {
      requestContext.setRequestTid(requestTid);
      res.setHeader("x-request-id", requestTid);
      next();
    });
  } catch (error) {
    logger.error(`Failed Setting Context with error=${error}`);
    next();
  }
};

const requestContext = {
  setRequestTid: (tid) => {
    try {
      const store = asyncLocalStorage.getStore();
      if (store) {
        logger.info(`Setting requestTid=${tid} in context`);
        store.set("requestTid", tid);
      } else {
        logger.error(`No active context to set tid=${tid}`);
      }
    } catch (error) {
      logger.error(`Failed to set tid to context with error=${error}`);
    }
  },

  getRequestTid: () => {
    try {
      const store = asyncLocalStorage.getStore();
      if (store) {
        return store.get("requestTid");
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get tid with error=${error}`);
    }
  },
};

const generateTid = () => {
  const timestamp = Date.now().toString(36); 
  return `${Math.random().toString(36).substring(2, 17)}${timestamp}`;
};

module.exports = { requestContextMiddleware, requestContext };
