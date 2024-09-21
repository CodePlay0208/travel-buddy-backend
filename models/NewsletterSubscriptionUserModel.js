const mongoose = require("mongoose");

const NewsletterSubscriptionUserSchema = new mongoose.Schema({
  emailId: { type: String, require: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: true, unique: true },
});

module.exports = mongoose.model(
  "NewsletterSubscriptionUser",
  NewsletterSubscriptionUserSchema,
  "NewsletterSubscritionUser"
);
