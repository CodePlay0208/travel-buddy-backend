const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^[0-9]+$/;
const crypto = require("crypto");
const { ValidationError } = require("./exceptions/ValidationError");

function isValidEmail(emailId) {
  if (!emailId || typeof emailId !== "string") {
    throw new ValidationError("Invalid email: emailId can't be empty or null");
  }

  if (!emailRegex.test(emailId)) {
    throw new ValidationError(`Invalid email=${emailId}`);
  }
  return true;
}

function isValidPhoneNumber(phoneNumber) {
  if (phoneNumber && phoneNumberRegex.test(phoneNumber)) {
    return true; // Valid phone number
  } else {
    throw new ValidationError(`Invalid phoneNumber=${phoneNumber}`);
  }
}

const randomFileName = (fileName, bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex") + fileName;
};

const dateFromDateString = (date) => {
  try {
    if (date == null || date == undefined) {
      return date;
    }
    var queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);
    return queryDate;
  } catch (error) {
    console.log("error converting date string to date format", error);
  }
  return null;
};
module.exports = { isValidEmail, randomFileName, dateFromDateString, isValidPhoneNumber };
