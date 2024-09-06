const mongoose = require("mongoose");

const NewsletterSubscriptionUserSchema = new mongoose.Schema({
  emailId: { type: String, require: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "NewsletterSubscriptionUser",
  NewsletterSubscriptionUserSchema,
  "NewsletterSubscritionUser"
);
