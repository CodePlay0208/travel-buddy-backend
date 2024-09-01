const TripData = require("../models/TripDataModel");
const asyncHandler = require("express-async-handler");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
} = require("../config/awsConfigs/S3");

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

    const { uploadedObjectNames, allObjectsUploaded } =
      await uploadObjectsToS3Bucket(files);

    const destinationImages = uploadedObjectNames;

    const newTrip = new TripData({
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
      destinationImages,
      userId,
    });

    const { files } = req;
    await newTrip.save();
    res.status(201).json({ allFilesUploaded: allObjectsUploaded });
  } catch (error) {
    console.error("Error while creating trip", error);
    res.status(500).json();
  }
});

const getTripByIdHandler = asyncHandler(async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await TripData.findOne({ _id: tripId });
    if (!trip) {
      return res.status(404).json();
    }

    trip.destinationImages = getObjectsFromS3Bucket(trip.destinationImages);
    res.status(200).json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json();
  }
});

const getTripsByUserHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    var trips = await TripData.find({ userId });
    trips = await Promise.all(
      trips.map(async (trip) => {
        trip.destinationImages = await getObjectsFromS3Bucket(
          trip.destinationImages
        );
        return trip;
      })
    );
    res.status(200).json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json();
  }
});

const editTripHandler = asyncHandler(async (req, res) => {
  try {
    const { tripId } = req.params;
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
      destinationImages,
    } = req.body;

    const userId = req.user._id;
    const tripInDatabase = await TripData.findById(tripId);

    console.log(tripInDatabase.userId);
    if (!tripInDatabase) {
      return res.status(404).json();
    }

    console.log(userId);
    if (!tripInDatabase.userId.equals(userId)) {
      return res.status(403).json();
    }

    const fieldsToUpdate = {
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
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        tripInDatabase[key] = value;
      }
    });
    var allFilesUploaded = true;
    if (
      destinationImages !== null &&
      destinationImages !== undefined &&
      destinationImages.length > 0
    ) {
      await deleteObjectsFromS3Bucket(tripInDatabase.destinationImages);
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(destinationImages);
      tripInDatabase.destinationImages = uploadedObjectNames;
      allFilesUploaded = allObjectsUploaded;
    }

    const updatedTrip = await tripInDatabase.save();
    res.status(200).json({ updatedTrip, allFilesUploaded });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

const deleteTripHandler = asyncHandler(async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const userId = req.user._id;

    const tripInDatabase = await TripData.findOne({
      _id: tripId,
      userId: userId,
    });

    if (!tripInDatabase) {
      return res.status(404).json();
    }

    await deleteObjectsFromS3Bucket(tripInDatabase.destinationImages);
    await tripInDatabase.deleteOne();
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

module.exports = {
  createTripHandler,
  getTripByIdHandler,
  getTripsByUserHandler,
  editTripHandler,
  deleteTripHandler,
};
