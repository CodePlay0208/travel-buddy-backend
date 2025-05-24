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
    logger.info(
      `Adding user with emailId=${emailId} to mailchimp audienceId=${audienceId} with tag=${tag}`
    );
    const subscriberHash = crypto
      .createHash(MAILCHIMP_HASH)
      .update(emailId.toLowerCase())
      .digest(MAILCHIMP_DIGEST);

    await mailChimpService.lists.setListMember(audienceId, subscriberHash, {
      email_address: emailId,
      status_if_new: MAILCHIMP_USER_SUBSCRIBED
    });

    await mailChimpService.lists.updateListMemberTags(audienceId, subscriberHash, {
      tags: [{ name: tag, status: MAILCHIMP_USER_ACTIVE }],
    });
  } catch (error) {
    logger.error(
      `Error occurred adding user with emailId=${emailId} to mailchimp audienceId=${audienceId} with tag=${tag}, error=${error}`
    );
    throw error;
  }
}

module.exports = { addMemberWithTag };
