const { ObjectId } = require('mongodb');
const TripData = require('../models/TripDataModel');
const asyncHandler = require("express-async-handler");

const createTripHandler = asyncHandler(async (req, res) => {
  try {
    const {
      destination, startDate, endDate, details,
      startLocation, endLocation, totalMembers, budget, age, sex,
      description, destinationImages
    } = req.body;

    const userId = req.user._id

    if (!userId) {
      return res.status(400).json({ message: 'User not found' });
    }

    const newTrip = new TripData({
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers, budget, age, sex,
      description, destinationImages, userId
    });

    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to insert trip', error });
  }
});


const getTripsWithFiltersHandler = asyncHandler(async (req, res) => {

  try {
    const { destination, date } = req.query;
    const userId = req.user._id;
    const queryDate = new Date(date);
    let query = {
      destination: destination,
      startDate: { $lte: queryDate },
      endDate: { $gte: queryDate },
    }

    if (userId) {
      query.userId = { $ne: new ObjectId(userId) }
    }
    const trips = await TripData.find(query);
    res.status(200).json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});


const getTripByIdHandler = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const tripIdObject = new ObjectId(id)
    const trip = await TripData.findOne({ _id: tripIdObject });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.status(200).json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});


const getTripsByUserHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const trips = await TripData.find({ userId: new ObjectId(userId) });
    res.status(200).json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

const editTripHandler = asyncHandler(async (req, res) => {
  try {

    const { tripId } = req.params;
    const {
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers, budget, age, sex,
      description, destinationImages
    } = req.body;

    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    if (!ObjectId.isValid(tripId)) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    const tripInDatabase = await TripData.findOne({ _id: tripId });

    if (!tripInDatabase) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (tripInDatabase.userId !== userId) {
      return res.status(403).json({ error: "You don't have access to edit this trip" });
    }

    const newTrip = {
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers, budget, age, sex,
      description, destinationImages, user
    };

    const updatedTrip = await TripData.findOneAndUpdate(
      { _id: new ObjectId(tripId) },
      { $set: newTrip },
      { new: true }
    );

    res.status(200).json({ message: 'Trip updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const deleteTripHandler = asyncHandler(async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const tripInDatabase = await TripData.findOne({_id: tripId, userId: userId});

    if (!tripInDatabase) {
      return res.status(404).json({ message: 'Trip not found or you do not have permission to delete this trip.' });
    }
    await tripInDatabase.remove();
    res.status(200).json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while deleting the trip.' });
  }
});



module.exports = { createTripHandler, getTripsWithFiltersHandler,
   getTripByIdHandler, getTripsByUserHandler, editTripHandler, deleteTripHandler };