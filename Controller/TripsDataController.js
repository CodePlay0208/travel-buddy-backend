const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForUserProfiles = process.env.COLLECTION_FOR_USER_PROFILES;
const collectionForTrip = process.env.COLLECTION_FOR_TRIPS_DATA;
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const client = new MongoClient(urlForMongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const TripData = require('../models/TripData');
const UserProfile = require('../models/UserProfile');
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
    const userExists = await getUserByUserId(user);
    if (!userExists) {
      return res.status(400).json({ message: 'User not found' });
    }

    const newTrip = new TripData({
      key, destination, startDate, endDate, details,
      startLocation, endLocation, totalMembers, age, sex,
      description, profileImg, destinationImages, user
    });

    await createTrip(newTrip);
    res.status(201).json(newTrip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to insert trip', error });
  }
});

async function getUserByUserId(userId) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionForUserProfiles);
    const result = await collection.findOne({ _id: new ObjectId(userId) });
    return result;
  } finally {
    await client.close();
  }
}

async function createTrip(trip) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);
    const tripCreated = await collection.insertOne(trip);
    return tripCreated;
  } finally {
    await client.close();
  }
}

// Fetch trips by destination and date
router.get('/trips', async (req, res) => {
  const { destination, date } = req.query;

  try {
    await client.connect();
    const trips = await findTripByDate(destination, date);
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

async function findTripByDate(destination, date) {
  try {
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);
    const trips = await collection.find({
      destination,
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) }
    }).toArray();
    return trips;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Fetch a single trip by ID
router.get('/trips/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await client.connect();
    const trip = await findTripById(id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

async function findTripById(id) {
  try {
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);
    const trip = await collection.findOne({ _id: new ObjectId(id) });
    return trip;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Fetch trips by user ID
router.get('/tripsByUser', async (req, res) => {
  const { userId } = req.query;

  try {
    await client.connect();
    const trips = await findTripsByUserId(userId);
    if (!trips || trips.length === 0) {
      return res.status(404).json({ message: 'No trips found for this user' });
    }
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

async function findTripsByUserId(userId) {
  try {
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);
    const trips = await collection.find({ user: new ObjectId(userId) }).toArray();
    return trips;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = router;