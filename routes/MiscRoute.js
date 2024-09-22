const express = require("express");
const router = express.Router();
const {
  NewsletterSubscriptionHandler,
} = require("../controller/NewsletterController");

router.route("/subscribeToNewsletter").post(NewsletterSubscriptionHandler);

module.exports = router;
