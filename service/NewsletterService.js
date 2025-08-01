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
    logger.info(`Starting newsletter subscription for emailId=${emailId}`);
    
    logger.info(`Validating email format for emailId=${emailId}`);
    newsletterValidator.validateEmail(emailId);
    logger.info(`Email validation successful for emailId=${emailId}`);
    
    const userId = uuidv4();
    logger.info(`Generated userId=${userId} for emailId=${emailId}`);
    
    const subscriptionData = {
      emailId,
      userId,
    };
    
    logger.info(`Creating newsletter subscription in database for emailId=${emailId}`);
    await newsletterRepository.createSubscription(subscriptionData);
    logger.info(`Successfully created newsletter subscription in database for emailId=${emailId}`);
    
    logger.info(`Adding member to MailChimp for emailId=${emailId}`);
    await mailChimpService.addMemberWithTag(
      emailId,
      process.env.MAILCHIMP_AUDIENCE_ID,
      MAILCHIMP_NEWSLETTER_TAG
    );
    logger.info(`Successfully added member to MailChimp for emailId=${emailId}`);
    
    logger.info(`Completed newsletter subscription for emailId=${emailId}`);
  } catch (error) {
    logger.error(`Failed to subscribe user to newsletter: emailId=${emailId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
};

module.exports = { subscribeUser };
