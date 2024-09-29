const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../Logger");
const { dateFromDateString } = require("../Utils");

const tripValidator = {
  validateLimit: (limit) => {
    limit = Number(limit);
    if (isNaN(limit) || limit < 0 || limit > 100) {
      throw new ValidationError(`Set a valid limit`);
    }
  },

  validateDate: (date) => {
    if (date) {
      const inputDate = dateFromDateString(date);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const oneYearFromNow = new Date(today);
      oneYearFromNow.setFullYear(today.getFullYear() + 1);

      if (inputDate < today) {
        throw new ValidationError("Date cannot be in the past.");
      }

      if (inputDate > oneYearFromNow) {
        throw new ValidationError(
          "Date cannot be more than 1 year from today."
        );
      }
    }
  },

  validateFilter: (filter) => {
    const {
      destination,
      date,
      offset = 0,
      limit = process.env.LIMIT_FOR_SENDING_TRIPS,
    } = filter;

    tripValidator.validateDate(date);
    tripValidator.validateLimit(limit);
  },
};

module.exports = tripValidator;
