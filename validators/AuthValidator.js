const { ValidationError } = require("../exceptions/ValidationError");
const { isValidEmail, isValidPhoneNumber } = require("../Utils");

function validateEmail(emailId) {
  isValidEmail(emailId);
}

function validateUserName(username) {
  if (!username) {
    throw new ValidationError(`Invalid username=${username}`);
  }
}

function validatePhoneNumber(phoneNumber) {
  if (phoneNumber) {
    isValidPhoneNumber(phoneNumber);
  }
}

const authValidator = {
  validateSignUpRequest: (payload) => {
    const { username, phoneNumber, useremail } = payload;
    validatePhoneNumber(phoneNumber);
    validateEmail(useremail);
    validateUserName(username);
  },

  validateLoginRequest: (payload) => {
    const { useremail } = payload;
    validateEmail(useremail);
  },

  validateForgotPasswordRequest: (useremail) => {
    validateEmail(useremail);
  },
};

module.exports = authValidator;
