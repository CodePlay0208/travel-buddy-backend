const { ValidationError } = require("../exceptions/ValidationError");
const { isValidEmail, isValidPhoneNumber, isPhoneNumberOrEmail } = require("../Utils");

function validateEmail(emailId) {
  isValidEmail(emailId);
}

function validateUserName(username) {
  if (!username) {
    throw new ValidationError(`Invalid username=${username}`);
  }
}

const authValidator = {
  validateSignUpRequest: (payload) => {
    const { username, userKey } = payload;
    isPhoneNumberOrEmail(userKey)
    validateUserName(username);
  },

  validateLoginRequest: (payload) => {
    const { userKey } = payload;
    isPhoneNumberOrEmail(userKey)
  },

};

module.exports = authValidator;
