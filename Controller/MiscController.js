const asyncHandler = require("express-async-handler");
const NewsletterSubscriptionUser = require("../models/NewsletterSubscriptionUserModel");

const NewsletterSubscriptionHandler = asyncHandler(async (req, res) => {
    try {
        const { emailId } = req.body;
        console.log(`Request received for subscribing user with emailId: ${emailId} to newsletter`);
        if (!emailId) {
            console.log("Error while subscribing user to newsletter: ", "emailId can't be empty or null");
            return res.status(400).json();
        }

        await NewsletterSubscriptionUser.findOneAndDelete({emailId: emailId});
        const newsletterSubscriptionUser = new NewsletterSubscriptionUser({
            emailId: emailId
        });
        await newsletterSubscriptionUser.save();
        res.status(200).json();
    }
    catch (error) {
        console.log("Error while subscribing user to newsletter: ", error);
        res.status(500).json();
    }
});

module.exports = {NewsletterSubscriptionHandler};