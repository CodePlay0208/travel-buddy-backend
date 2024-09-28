const { ValidationError } = require("../exceptions/ValidationError");

const newsletterValidator = {
  validateEmail: (emailId) => {
    if (!emailId || typeof emailId !== 'string') {
      throw new ValidationError("Invalid email: emailId can't be empty or null");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailId)) {
      throw new ValidationError("Invalid email format");
    }
  },
};

module.exports = newsletterValidator;
