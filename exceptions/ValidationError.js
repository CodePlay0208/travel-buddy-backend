class ValidationError extends Error {
  constructor(message, errorCode = 400) {
    super(message);
    this.name = "ValidationError";
    this.errorCode = errorCode;
  }
}

module.exports = { ValidationError };
