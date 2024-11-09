const express = require("express");
const router = express.Router();
const {
  NewsletterSubscriptionHandler,
} = require("../xyz/NewsletterController");

router.route("/subscribeToNewsletter").post(NewsletterSubscriptionHandler);

module.exports = router;
