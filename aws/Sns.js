const asyncHandler = require("express-async-handler");
const { snsClient } = require("./Config");
const logger = require("../logger");

async function sendTextMessagesToPhoneNumber(phoneNumber, otp, username) {
  phoneNumber = "9896311789"
  const params = {
    Message: `Hi ${username} your otp for signing up at travmigoz is ${otp}. This code is valid for 5 minutes. Please don't share it with anyone`,
    PhoneNumber: `+91${phoneNumber}`,
  };

  try {
    const data = await snsClient.publish(params).promise();
    logger.info("Message sent successfully:", data);
  } catch (error) {
    logger.error("Error sending message:", error);
  }
}

module.exports = {
  sendTextMessagesToPhoneNumber,
};
