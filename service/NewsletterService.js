const newsletterRepository = require("../repositories/NewsletterRepository");
const mailChimpService = require("../mailchimp/MailChimpService");
const { v4: uuidv4 } = require("uuid");
const newsletterValidator = require("../validators/NewsletterValidator");
const logger = require("../logger");
const {
  MAILCHIMP_NEWSLETTER_TAG,
} = require("../constants/MailChimpConstants");

const subscribeUser = async (emailId) => {
  try {
    logger.info(
      `Subscribing user with emailId=${emailId} to the newsletter`
    );
    newsletterValidator.validateEmail(emailId);
    const userId = uuidv4();
    const subscriptionData = {
      emailId,
      userId,
    };
    await newsletterRepository.createSubscription(subscriptionData);
    await mailChimpService.addMemberWithTag(
      emailId,
      process.env.MAILCHIMP_AUDIENCE_ID,
      MAILCHIMP_NEWSLETTER_TAG
    );
  } catch (error) {
    logger.error(
      `Error occurred while subscribing user with emailId=${emailId} to the newsletter, error=${error}`
    );
    throw error;
  }
};

module.exports = { subscribeUser };
