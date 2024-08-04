const TripData = require('../models/TripDataModel');
const asyncHandler = require("express-async-handler");

async function getLocationsFromGooglePlaces(inputLocation) {
    try {
        const params = {
            input: inputLocation,
            key: process.env.API_KEY_FOR_GOOGLE_PLACES_API,
            components: "country:IN"
        }
        const url = new URL(process.env.URL_FOR_GOOGLE_PLACES_API);
        url.search = new URLSearchParams(params).toString();
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message || "Failed to fetch locations.");
        }
        return data;
    } catch (error) {
        console.error("Failed to fetch user data:", error.message);
        throw error;
    }
}

const getLocationsAsCityAndState = (locations) => {
    return locations.map(location => {
        const [firstWord, secondWord] = location.description.split(',').map(word => word.trim());
        return {
            city: firstWord || '',
            state: secondWord || ''
        };
    });
}

const getLocationByNameHandler = asyncHandler(async (req, res) => {
    try {
        const { inputLocation } = req.params;
        console.log(inputLocation);
        const prefixMatchingLocations = await getLocationsFromGooglePlaces(inputLocation);
        const transformedLocations = getLocationsAsCityAndState(prefixMatchingLocations.predictions);
        res.status(200).json(transformedLocations);
    }
    catch (error) {
        res.status(500).json(error);
    }
});

module.exports = { getLocationByNameHandler };