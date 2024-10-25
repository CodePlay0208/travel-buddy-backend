const { isValidEmail } = require("../Utils");

const newsletterValidator = {
  validateEmail: (emailId) => {
    isValidEmail(emailId);
  },
};

module.exports = newsletterValidator;
