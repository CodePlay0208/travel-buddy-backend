const Gender = require("../enums/Gender");
const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const { getMaxListeners } = require("../models/TripDataModel");
const { dateFromDateString } = require("../Utils");

const tripValidator = {
  validateLimit: (limit) => {
    limit = Number(limit);
    if (isNaN(limit) || limit < 0 || limit > 100) {
      limit = process.env.LIMIT_FOR_SENDING_TRIPS;
      logger.warn(`Invalid Limit`, limit);
    }
  },

  validateDate: (date) => {
    if (date) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const oneYearFromNow = new Date(today);
      oneYearFromNow.setFullYear(today.getFullYear() + 1);

      if (date < today) {
        throw new ValidationError("Date cannot be in the past.");
      }

      if (date > oneYearFromNow) {
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
      limit = parseInt(process.env.LIMIT_FOR_SENDING_TRIPS, 10),
    } = filter;

    tripValidator.validateDate(date);
    tripValidator.validateLimit(limit);
  },

  validateStartEndDateAndEndDate: (startDate, endDate) => {
    if (startDate > endDate) {
      throw new ValidationError(
        `Start Date is greater than end Date, startDate=${startDate}, endDate=${endDate}`
      );
    }
    tripValidator.validateDate(startDate);
    tripValidator.validateDate(endDate);
  },

  validateDescription: (description) => {
    if (
      description &&
      description.length > process.env.LIMIT_FOR_TOTAL_LETTERS_IN_DESCRIPTION
    ) {
      throw new ValidationError(
        `Description too long, description=${description}`
      );
    }
  },
};

module.exports = tripValidator;
