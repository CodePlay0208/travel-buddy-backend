const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(emailId) {
  return emailRegex.test(emailId);
}

module.exports = {isValidEmail };
