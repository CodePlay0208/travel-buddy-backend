const TripData = require("../models/TripDataModel");
const asyncHandler = require("express-async-handler");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
} = require("../config/awsConfigs/S3");
const { dateFromDateString } = require("../Utils");
const logger = require("../logger"); 

const createTripHandler = asyncHandler(async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      startLocation,
      endLocation,
      totalMembers,
      budget,
      age,
      gender,
      description,
    } = req.body;

    const userId = req.user._id;
    const { files } = req;
    logger.info(`Creating a new trip for user ${userId}`);

    const { uploadedObjectNames, allObjectsUploaded } =
      await uploadObjectsToS3Bucket(files);

    const destinationImages = uploadedObjectNames;
    const queryStartDate = dateFromDateString(startDate);
    const queryEndDate = dateFromDateString(endDate);

    const newTrip = new TripData({
      destination,
      startDate: queryStartDate,
      endDate: queryEndDate,
      startLocation,
      endLocation,
      totalMembers,
      budget,
      age,
      gender,
      description,
      destinationImages,
      userId,
    });

    const newtripInDatabase = await newTrip.save();
    logger.info(`Trip created successfully for user ${userId}`);
    res
      .status(201)
      .json({allFilesUploaded: allObjectsUploaded});
  } catch (error) {
    logger.error(`Error while creating trip: ${error.message}`);
    res.status(500).json();
  }
});

const getTripByIdHandler = asyncHandler(async (req, res) => {
  try {
    const { tripId } = req.params;
    logger.info(`Fetching trip with ID: ${tripId}`);

    const trip = await TripData.findOne({ _id: tripId });
    if (!trip) {
      logger.error(`Trip not found for ID: ${tripId}`);
      return res.status(404).json();
    }
    trip.destinationImages = await getObjectsFromS3Bucket(
      trip.destinationImages
    );
    res.status(200).json(trip);
  } catch (error) {
    logger.error(`Error fetching trip by ID: ${error.message}`);
    res.status(500).json();
  }
});

const getTripsByUserHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    logger.info(`Fetching trips for user ${userId}`);

    const { offset = 0, limit = process.env.LIMIT_FOR_SENDING_TRIPS } =
      req.query;

    const parsedOffset = parseInt(offset, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;
    const limitNumber =
      isNaN(parsedLimit) || parsedLimit < 0
        ? process.env.LIMIT_FOR_SENDING_TRIPS
        : parsedLimit;

    var trips = await TripData.find({ userId }).skip(skip).limit(limitNumber);

    if (trips.length === 0) {
      logger.error(`No trips found for user ${userId}`);
      return res.status(404).json();
    }

    const newOffset = skip + parsedLimit;
    trips = await Promise.all(
      trips.map(async (trip) => {
        trip.destinationImages = await getObjectsFromS3Bucket(
          trip.destinationImages
        );
        return trip;
      })
    );
    logger.info(`Fetched ${trips.length} trips for user ${userId}`);
    res.status(200).json({ trips, offset: newOffset });
  } catch (error) {
    logger.error(`Error fetching trips by user: ${error.message}`);
    res.status(500).json();
  }
});

const getTripsWithFilterHandler = asyncHandler(async (req, res) => {
  try {
    const {
      destination,
      date,
      offset = 0,
      limit = process.env.LIMIT_FOR_SENDING_TRIPS,
    } = req.query;
    const userId = req?.user?._id;

    let query = {};

    if (destination) {
      query.destination = destination;
    }

    if (date) {
      const queryDate = new Date(date);
      if (!isNaN(queryDate)) {
        query.startDate = { $lte: queryDate };
        query.endDate = { $gte: queryDate };
      } else {
        logger.error("Invalid date passed in query");
        return res.status(400).json();
      }
    }

    if (userId) {
      query.userId = { $ne: userId };
    }

    const parsedOffset = parseInt(offset, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;
    const limitNumber =
      isNaN(parsedLimit) || parsedLimit < 0
        ? process.env.LIMIT_FOR_SENDING_TRIPS
        : parsedLimit;

    var trips = await TripData.find(query).skip(skip).limit(limitNumber);

    if (trips.length === 0) {
      logger.error("No trips found with the given filter");
      return res.status(404).json();
    }

    const newOffset = skip + parsedLimit;
    trips = await Promise.all(
      trips.map(async (trip) => {
        trip.destinationImages = await getObjectsFromS3Bucket(
          trip.destinationImages
        );
        return trip;
      })
    );

    logger.info(`Fetched ${trips.length} trips with filter`);
    res.status(200).json({ trips, offset: newOffset });
  } catch (error) {
    logger.error(`Error fetching trips with filter: ${error.message}`);
    res.status(500).json();
  }
});

const editTripHandler = asyncHandler(async (req, res) => {
  try {
    const { tripId } = req.params;
    logger.info(`Editing trip with ID: ${tripId}`);

    const {
      destination,
      startDate,
      endDate,
      startLocation,
      endLocation,
      totalMembers,
      budget,
      age,
      gender,
      description,
    } = req.body;

    const userId = req.user._id;
    const tripInDatabase = await TripData.findById(tripId);

    if (!tripInDatabase) {
      logger.error(`Trip with ID: ${tripId} not found`);
      return res.status(404).json();
    }
    if (!tripInDatabase.userId.equals(userId)) {
      logger.error(
        `User ${userId} not authorized to edit trip with ID: ${tripId}`
      );
      return res.status(403).json();
    }

    const queryStartDate = dateFromDateString(startDate);
    const queryEndDate = dateFromDateString(endDate);
    const fieldsToUpdate = {
      destination,
      startDate: queryStartDate,
      endDate: queryEndDate,
      startLocation,
      endLocation,
      totalMembers,
      budget,
      age,
      gender,
      description,
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        tripInDatabase[key] = value;
      }
    });

    var allFilesUploaded = true;
    const newDestinationImages = req.files;
    if (newDestinationImages && newDestinationImages.length > 0) {
      await deleteObjectsFromS3Bucket(tripInDatabase.destinationImages);
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(newDestinationImages);
      tripInDatabase.destinationImages = uploadedObjectNames;
      allFilesUploaded = allObjectsUploaded;
    }

    const updatedTrip = await tripInDatabase.save();
    logger.info(`Trip with ID: ${tripId} updated successfully`);
    res.status(200).json({  allFilesUploaded });
  } catch (err) {
    logger.error(`Error editing trip: ${err.message}`);
    res.status(500).json();
  }
});

const deleteTripHandler = asyncHandler(async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const userId = req.user._id;

    const tripInDatabase = await TripData.findOne({
      _id: tripId,
      userId,
    });

    if (!tripInDatabase) {
      logger.error(`Trip with ID: ${tripId} not found`);
      return res.status(404).json();
    }

    await deleteObjectsFromS3Bucket(tripInDatabase.destinationImages);
    await tripInDatabase.deleteOne();
    logger.info(`Trip with ID: ${tripId} deleted successfully`);
    res.status(200).json();
  } catch (error) {
    logger.error(`Error deleting trip: ${error.message}`);
    res.status(500).json();
  }
});

module.exports = {
  createTripHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteTripHandler,
  getTripsWithFilterHandler,
};
