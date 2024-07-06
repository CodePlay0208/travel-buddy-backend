const express = require('express');
const router = express.Router();
const TripData = require('../models/TripData');
const UserProfile = require('../models/UserProfile');
const bodyParser = require('body-parser');

router.use(bodyParser.json());

// Add a new trip
router.post('/trips', async (req, res) => {
  const {
    key, destination, startDate, endDate, details,
    startLocation, endLocation, totalMembers, age, sex,
    description, profileImg, destinationImages, user
  } = req.body;

  try {
    // Ensure the user exists
    const userExists = await UserProfile.findById(user);
    if (!userExists) {
      return res.status(400).json({ message: 'User not found' });
    }

    const newTrip = new TripData({
      key, destination, startDate, endDate, details,
      startLocation, endLocation, totalMembers, age, sex,
      description, profileImg, destinationImages, user
    });

    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to insert trip', error });
  }
});

// Fetch trips by destination and date
router.get('/trips', async (req, res) => {
  const { destination, date } = req.query;

  try {
    const trips = await TripData.find({
      destination: destination,
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) }
    }).populate('user');

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// Fetch a single trip by ID
router.get('/trips/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await TripData.findById(id).populate('user');
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

module.exports = router;
