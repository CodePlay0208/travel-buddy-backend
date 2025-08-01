const NewsletterSubscriptionUser = require("../models/NewsletterSubscriptionUserModel");
const databaseConstants = require("../constants/DatabaseConstants");
const logger = require("../logger");

const createSubscription = async (subscriptionData) => {
  try {
    logger.info(`Creating newsletter subscription for emailId=${subscriptionData?.emailId}`);
    
    const newsletterSubscriptionUser = new NewsletterSubscriptionUser(
      subscriptionData
    );
    await newsletterSubscriptionUser.save();
    
    logger.info(`Successfully created newsletter subscription for emailId=${subscriptionData?.emailId}`);
  } catch (error) {
    if (error.code != databaseConstants.UNIQUE_CONSTRAINT_ERROR_CODE) {
      logger.error(`Failed to create newsletter subscription: emailId=${subscriptionData?.emailId}, error=${error.message}`);
      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    }
    logger.warn(`User with emailId=${subscriptionData?.emailId} is already subscribed to newsletter`);
  }
};

module.exports = {
  createSubscription,
};
