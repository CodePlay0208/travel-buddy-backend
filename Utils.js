const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^[0-9]+$/;
const crypto = require("crypto");
const { ValidationError } = require("./exceptions/ValidationError");
const logger = require("./Logger");

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
    return true;
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
    const [day, month, year] = date.split("-").map(Number);
    const inputDate = new Date(year, month - 1, day + 1);
    inputDate.setUTCHours(0, 0, 0, 0);
    return inputDate;
  } catch (error) {
    logger.error(`error converting date string to date format, error=${error}`);
  }
  return null;
};

const parseLimitAndOffset = (limit, offset, defaultLimit) => {
  const parsedOffset = parseInt(offset, 10);
  const parsedLimit = parseInt(limit, 10);
  const skip = isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;
  const limitNumber =
    isNaN(parsedLimit) || parsedLimit < 0
      ? process.env.LIMIT_FOR_SENDING_TRIPS
      : parsedLimit;

  const newOffset = skip + limitNumber;
  return { skip, limitNumber, newOffset };
};

module.exports = {
  isValidEmail,
  randomFileName,
  dateFromDateString,
  isValidPhoneNumber,
  parseLimitAndOffset,
};
