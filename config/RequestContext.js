const { AsyncLocalStorage } = require("async_hooks");
const logger = require("../Logger");
const asyncLocalStorage = new AsyncLocalStorage();

const requestContext = {
  setRequestTid: (tid) => {
    try {
      asyncLocalStorage.run(new Map(), () => {
        asyncLocalStorage.getStore().set("requestTid", tid);
      });
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

module.exports = requestContext;
