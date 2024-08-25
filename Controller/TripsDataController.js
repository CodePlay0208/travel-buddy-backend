const { ObjectId } = require('mongodb');
const TripData = require('../models/TripDataModel');
const asyncHandler = require("express-async-handler");

const createTripHandler = asyncHandler(async (req, res) => {
  try {
    const {
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers, budget, age, gender,
      description, destinationImages
    } = req.body;

    const userId = req.user._id;

    const newTrip = new TripData({
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers, budget, age, gender,
      description, destinationImages, userId
    });

    await newTrip.save();
    res.status(201).json();
  } catch (error) {
    console.error(error);
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
    res.status(200).json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json();
  }
});


const getTripsByUserHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const trips = await TripData.find({ userId });
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
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers, budget, age, gender,
      description, destinationImages
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
    if (destination) tripInDatabase.destination = destination;
    if (startDate) tripInDatabase.startDate = startDate;
    if (endDate) tripInDatabase.endDate = endDate;
    if (startLocation) tripInDatabase.startLocation = startLocation;
    if (endLocation) tripInDatabase.endLocation = endLocation;
    if (totalMembers) tripInDatabase.totalMembers = totalMembers;
    if (budget) tripInDatabase.budget = budget;
    if (age) tripInDatabase.age = age;
    if (gender) tripInDatabase.gender = gender;
    if (description) tripInDatabase.description = description;
    if (destinationImages) tripInDatabase.destinationImages = destinationImages;

    const updatedTrip = await tripInDatabase.save();
    res.status(200).json(updatedTrip);

  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

const deleteTripHandler = asyncHandler(async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const userId = req.user._id;

    const tripInDatabase = await TripData.findOne({ _id: tripId, userId: userId });

    if (!tripInDatabase) {
      return res.status(404).json();
    }

    console.log(tripInDatabase)
    await tripInDatabase.deleteOne();
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});



module.exports = {
  createTripHandler,
  getTripByIdHandler, getTripsByUserHandler, editTripHandler, deleteTripHandler
};