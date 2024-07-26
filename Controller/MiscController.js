const asyncHandler = require("express-async-handler");
const NewsletterSubscriptionUser = require("../models/NewsletterSubscriptionUserModel");

const NewsletterSubscriptionHandler = asyncHandler(async (req, res) => {
    try {
        console.log("hey");
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "Email ID is required" });
        }
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