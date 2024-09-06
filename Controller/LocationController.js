const TripData = require('../models/TripDataModel');
const asyncHandler = require("express-async-handler");
const logger = require('../logger'); // Import the Winston logger

async function getLocationsFromGooglePlaces(inputLocation) {
    try {
        logger.info(`Request received to fetch locations for input: ${inputLocation}`);
        
        const params = {
            input: inputLocation,
            key: process.env.API_KEY_FOR_GOOGLE_PLACES_API,
            components: "country:IN"
        };
        
        const url = new URL(process.env.URL_FOR_GOOGLE_PLACES_API);
        url.search = new URLSearchParams(params).toString();
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        
        if (!response.ok) {
            logger.error(`Failed to fetch locations from Google Places API: ${response.statusText}`);
            throw new Error(`Google Places API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            logger.error(`Error from Google Places API: ${data.error.message}`);
            throw new Error(data.error.message || "Failed to fetch locations.");
        }

        logger.info(`Successfully fetched locations for input: ${inputLocation}`);
        return data;
        
    } catch (error) {
        logger.error(`Error fetching locations for input ${inputLocation}: ${error.message}`);
        throw error;
    }
}

const getLocationsAsCityAndState = (locations) => {
    return locations.map(location => {
        const [firstWord, secondWord] = location.description.split(',').map(word => word.trim());
        logger.info(`Transforming location: ${location.description} into city and state.`);
        return {
            city: firstWord || '',
            state: secondWord || ''
        };
    });
}

const getLocationByNameHandler = asyncHandler(async (req, res) => {
    try {
        const { inputLocation } = req.params;

        logger.info(`Location request received for input: ${inputLocation}`);
        
        const prefixMatchingLocations = await getLocationsFromGooglePlaces(inputLocation);
        const limitedNumberOfLocations = prefixMatchingLocations.predictions.slice(0, process.env.LIMIT_FOR_LOCATIONS_BY_GOOGLE_PLACES_API || 5);
        
        logger.info(`Fetched ${limitedNumberOfLocations.length} matching locations for input: ${inputLocation}`);
        
        const transformedLocations = getLocationsAsCityAndState(limitedNumberOfLocations);
        
        res.status(200).json(transformedLocations);
        logger.info(`Successfully sent transformed locations for input: ${inputLocation}`);
        
    } catch (error) {
        logger.error(`Error in getLocationByNameHandler: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch locations." });
    }
});

module.exports = { getLocationByNameHandler };
