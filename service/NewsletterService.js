const newsletterRepository = require("../database/NewsletterRepository");
const { v4: uuidv4 } = require("uuid");
const logger = require("../Logger");

const subscribeUser = async (emailId) => {
  try {
    const userId = uuidv4();

    const subscriptionData = {
      emailId,
      userId,
    };
    await newsletterRepository.createSubscription(subscriptionData);
  } catch (error) {
    logger.error(
      `Error occurred while subscribing user with emailId=${emailId} to the newsletter`
    );
    throw error;
  }
};

module.exports = { subscribeUser };
