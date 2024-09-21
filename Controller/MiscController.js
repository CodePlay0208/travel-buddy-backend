const asyncHandler = require("express-async-handler");
const NewsletterSubscriptionUser = require("../models/NewsletterSubscriptionUserModel");
const logger = require("../logger");
const { v4: uuidv4 } = require("uuid");

const NewsletterSubscriptionHandler = asyncHandler(async (req, res) => {
  try {
    const { emailId } = req.body;
    logger.info(`Request received to subscribe user with emailId: ${emailId}`);
    if (!emailId) {
      logger.error("Subscription failed: emailId is empty or null");
      return res.status(400).json({ error: "emailId can't be empty or null" });
    }

    // Remove any existing subscription for the same email before adding a new one
    await NewsletterSubscriptionUser.findOneAndDelete({ emailId: emailId });
    const userId = uuidv4();
    const newsletterSubscriptionUser = new NewsletterSubscriptionUser({
      emailId,
      userId,
    });
    await newsletterSubscriptionUser.save();

    logger.info(
      `User with emailId: ${emailId} successfully subscribed to the newsletter.`
    );
    res.status(200).json({ message: "Subscription successful" });
  } catch (error) {
    logger.error(
      `Error while subscribing user with emailId: ${req.body.emailId}: ${error.message}`
    );
    res.status(500).json({ error: "Failed to subscribe to newsletter" });
  }
});

module.exports = { NewsletterSubscriptionHandler };
