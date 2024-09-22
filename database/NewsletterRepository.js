const NewsletterSubscriptionUser = require("../models/NewsletterSubscriptionUserModel");
const databaseConstants = require("../constants/DatabaseConstants");
const logger = require("../Logger");

const createSubscription = async (subscriptionData) => {
  try {
    const newsletterSubscriptionUser = new NewsletterSubscriptionUser(
      subscriptionData
    );
    await newsletterSubscriptionUser.save();
  } catch (error) {
    if (error.code != databaseConstants.UNIQUE_CONSTRAINT_ERROR_CODE) {
      throw error;
    }
    logger.warn(
      `User with email ${subscriptionData.emailId} is already subscribed.`
    );
  }
};

module.exports = {
  createSubscription,
};
