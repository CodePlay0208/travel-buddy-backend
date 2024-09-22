const asyncHandler = require("express-async-handler");
const newsletterService = require("../service/NewsletterService");
const logger = require("../Logger");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  NEWSLETTER_SUBSCRIPTION,
} = require("../constants/ApiConstants");
const newsletterValidations = require("../validators/NewsletterValidator");
const requestContext = require("../config/RequestContext");
const {ValidationError} = require("../exceptions/ValidationError");

const NewsletterSubscriptionHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${NEWSLETTER_SUBSCRIPTION}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const { emailId } = req.body;

    newsletterValidations.validateEmail(emailId);

    await newsletterService.subscribeUser(emailId);

    res.status(200).json();
    const endTime = Date.now();
    logger.info(
      `API_NAME=${NEWSLETTER_SUBSCRIPTION}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${NEWSLETTER_SUBSCRIPTION}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

module.exports = { NewsletterSubscriptionHandler };
