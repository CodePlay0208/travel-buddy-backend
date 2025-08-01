const {
  MAILCHIMP_HASH,
  MAILCHIMP_DIGEST,
  MAILCHIMP_USER_SUBSCRIBED,
  MAILCHIMP_USER_ACTIVE,
} = require("../constants/MailChimpConstants");
const mailChimpService = require("./MailChimpClient");
const crypto = require("crypto");
const logger = require("../logger");

async function addMemberWithTag(emailId, audienceId, tag) {
  try {
    logger.info(`Starting addMemberWithTag for emailId=${emailId}, audienceId=${audienceId}, tag=${tag}`);
    
    const subscriberHash = crypto
      .createHash(MAILCHIMP_HASH)
      .update(emailId.toLowerCase())
      .digest(MAILCHIMP_DIGEST);
    
    logger.debug(`Generated subscriber hash for emailId=${emailId}: ${subscriberHash}`);

    logger.info(`Adding member to MailChimp list: audienceId=${audienceId}, subscriberHash=${subscriberHash}`);
    await mailChimpService.lists.setListMember(audienceId, subscriberHash, {
      email_address: emailId,
      status_if_new: MAILCHIMP_USER_SUBSCRIBED
    });
    logger.info(`Successfully added member to MailChimp list: emailId=${emailId}, audienceId=${audienceId}`);

    logger.info(`Adding tag to member: tag=${tag}, audienceId=${audienceId}, subscriberHash=${subscriberHash}`);
    await mailChimpService.lists.updateListMemberTags(audienceId, subscriberHash, {
      tags: [{ name: tag, status: MAILCHIMP_USER_ACTIVE }],
    });
    logger.info(`Successfully added tag to member: emailId=${emailId}, tag=${tag}, audienceId=${audienceId}`);
    
    logger.info(`Completed addMemberWithTag for emailId=${emailId}, audienceId=${audienceId}, tag=${tag}`);
  } catch (error) {
    logger.error(`Failed to add member with tag: emailId=${emailId}, audienceId=${audienceId}, tag=${tag}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = { addMemberWithTag };
