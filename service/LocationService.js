const logger = require("../logger");

async function getLocationsFromGooglePlaces(inputLocation) {
  try {
    logger.info(`Starting Google Places API request for input: ${inputLocation}`);

    const params = {
      input: inputLocation,
      key: process.env.API_KEY_FOR_GOOGLE_PLACES_API,
      components: "country:IN",
    };

    logger.debug(`Building Google Places API URL with params: input=${inputLocation}`);
    const url = new URL(process.env.URL_FOR_GOOGLE_PLACES_API);
    url.search = new URLSearchParams(params).toString();

    logger.info(`Making HTTP request to Google Places API for input: ${inputLocation}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      logger.error(`Google Places API HTTP error: status=${response.status}, statusText=${response.statusText}`);
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    logger.debug(`Parsing Google Places API response for input: ${inputLocation}`);
    const data = await response.json();
    
    if (data.error) {
      logger.error(`Google Places API returned error: ${data.error.message}`);
      throw new Error(data.error || "Failed to fetch locations.");
    }

    logger.info(`Successfully fetched ${data.predictions?.length || 0} locations from Google Places API for input: ${inputLocation}`);
    return data;
  } catch (error) {
    logger.error(`Failed to fetch locations from Google Places API: input=${inputLocation}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

function getLocationsAsCityAndState(locations) {
  try {
    logger.debug(`Transforming ${locations?.length || 0} locations to city/state format`);
    
    const transformedLocations = locations.map((location) => {
      const [firstWord, secondWord] = location.description
        .split(",")
        .map((word) => word.trim());
      return {
        city: firstWord || "",
        state: secondWord || "",
      };
    });
    
    logger.debug(`Successfully transformed ${transformedLocations.length} locations to city/state format`);
    return transformedLocations;
  } catch (error) {
    logger.error(`Failed to transform locations to city/state format: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getLocationsByName(inputLocation) {
  try {
    logger.info(`Starting location search for input: ${inputLocation}`);
    
    logger.info(`Fetching locations from Google Places API for input: ${inputLocation}`);
    const prefixMatchingLocations = await getLocationsFromGooglePlaces(
      inputLocation
    );

    const limit = parseInt(process.env.LIMIT_FOR_LOCATIONS_BY_GOOGLE_PLACES_API) || 5;
    logger.debug(`Limiting results to ${limit} locations`);
    
    const limitedNumberOfLocations = prefixMatchingLocations.predictions.slice(0, limit);

    logger.info(`Retrieved ${limitedNumberOfLocations.length} matching locations for input: ${inputLocation}`);

    logger.debug(`Transforming locations to city/state format`);
    const transformedLocations = getLocationsAsCityAndState(
      limitedNumberOfLocations
    );

    logger.info(`Successfully completed location search for input: ${inputLocation}, returned ${transformedLocations.length} locations`);
    return transformedLocations;
  } catch (error) {
    logger.error(`Failed to get locations by name: input=${inputLocation}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = {
  getLocationsByName,
};
