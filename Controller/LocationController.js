const asyncHandler = require("express-async-handler");
const logger = require("../Logger");
const locationService = require("../service/LocationService");
const {
  API_STARTED,
  API_FAILED,
  API_SUCCESS,
  LOCATIONS_FROM_GOOGLE,
} = require("../constants/ApiConstants");

const getLocationByNameHandler = asyncHandler(async (req, res) => {
  const REQUEST_TID = requestContext.getRequestTid();
  try {
    const startTime = Date.now();
    logger.info(
      `Request recieved for API_NAME=${LOCATIONS_FROM_GOOGLE}, API_STATUS=${API_STARTED}, REQUEST_TID=${REQUEST_TID}`
    );

    const { inputLocation } = req.params;

    const transformedLocations = await locationService.getLocationsByName(
      inputLocation
    );

    res.status(200).json(transformedLocations);
    const endTime = Date.now();
    logger.info(
      `API_NAME=${NEWSLETTER_SUBSCRIPTION}, API_STATUS=${API_SUCCESS}, REQUEST_TID=${REQUEST_TID}, API_EXECUTION_TIME_IN_MS=${
        endTime - startTime
      }`
    );
  } catch (error) {
    logger.error(
      `API_NAME=${LOCATIONS_FROM_GOOGLE}, API_STATUS=${API_FAILED}, REQUEST_TID=${REQUEST_TID}, ERROR=${error}`
    );
    res.status(500).json();
  }
});

module.exports = {
  getLocationByNameHandler,
};
