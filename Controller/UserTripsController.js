const express = require('express');
const router = express.Router();
const Trip = require('../models/UserTrip');
const bodyParser = require('body-parser');

router.use(bodyParser.json());

// Fetch trips by user ID
router.get('/getTripsByUser', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const trips = await Trip.find({ user: userId }).populate('user', 'name profileImg');

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// Create a new trip
router.post('/createTrip', async (req, res) => {
  const { user, startLocation, endLocation, destinationImages, totalMembers, age, sex, description, startDate, endDate } = req.body;

  if (!user || !startLocation || !endLocation || !destinationImages || !totalMembers || !age || !sex || !description || !startDate || !endDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newTrip = new Trip({ user, startLocation, endLocation, destinationImages, totalMembers, age, sex, description, startDate, endDate });
    await newTrip.save();
    res.status(201).json({ message: 'Trip created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

module.exports = router;
