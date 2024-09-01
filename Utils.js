const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const crypto = require("crypto");

function isValidEmail(emailId) {
  return emailRegex.test(emailId);
}

const randomFileName = (fileName, bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex') + fileName;
}

module.exports = {isValidEmail, randomFileName };
