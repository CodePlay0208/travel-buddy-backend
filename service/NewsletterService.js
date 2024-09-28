const newsletterRepository = require("../repositories/NewsletterRepository");
const { v4: uuidv4 } = require("uuid");
const newsletterValidator = require("../validators/NewsletterValidator");
const logger = require("../Logger");

const subscribeUser = async (emailId) => {
  try {
    newsletterValidator.validateEmail(emailId);
    const userId = uuidv4();
    const subscriptionData = {
      emailId,
      userId,
    };
    await newsletterRepository.createSubscription(subscriptionData);
  } catch (error) {
    logger.error(
      `Error occurred while subscribing user with emailId=${emailId} to the newsletter, error=${error}`
    );
    throw error;
  }
};

module.exports = { subscribeUser };
