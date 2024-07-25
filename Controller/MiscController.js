const asyncHandler = require("express-async-handler");
const NewsletterSubscriptionUser = require("../models/NewsletterSubscriptionUserModel");

const NewsletterSubscriptionHandler = asyncHandler(async (req, res) => {
    try {
        const { emailId } = req.body;
        const newsletterSubscriptionUser = new NewsletterSubscriptionUser({
            emailId: emailId
        });
        await newsletterSubscriptionUser.save();
        res.status(200).json("User Subscribed");
    }
    catch (error) {
        res.status(500).json(error);
    }
});

module.exports = {NewsletterSubscriptionHandler};