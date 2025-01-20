const asyncHandler = require("express-async-handler");
const logger = require("../logger");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  SEND_OTP_TO_PARTNERS,
  PARTNER_LOGIN
} = require("../constants/ApiConstants");
const { requestContext } = require("../middleware/RequestContextMiddleware");
const partnersService = require("../service/PartnersService");
const { ValidationError } = require("../exceptions/ValidationError");


const sendOtpHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${SEND_OTP_TO_PARTNERS}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const {useremail} = req.body;
    const token = await partnersService.sendOtp(useremail);
    res.status(200).json({token});

    const endTime = Date.now();
    logger.info(
      `API_NAME=${SEND_OTP_TO_PARTNERS}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${SEND_OTP_TO_PARTNERS}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});

const loginHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${PARTNER_LOGIN}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );
    const token = await partnersService.login(req.body);
    res.status(200).json({ token });
    const endTime = Date.now();
    logger.info(
      `API_NAME=${PARTNER_LOGIN}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }ms
`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${PARTNER_LOGIN}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    if (error instanceof ValidationError) {
      res.status(400).json();
    } else {
      res.status(500).json();
    }
  }
});


module.exports = {
  loginHandler,
  sendOtpHandler,
};
