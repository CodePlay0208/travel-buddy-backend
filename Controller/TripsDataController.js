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
    destination, startDate, endDate, details,
    startLocation, endLocation, totalMembers,budget, age, sex,
    description, destinationImages
  } = req.body;

  const user = req.session? req.session.user ? req.session.user.id : null : null;

  console.log(req.session);
  console.log(req.session.user);
  console.log(user);

  try {
    // Ensure the user exists
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const newTrip = new TripData({
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers,budget, age, sex,
      description, destinationImages, user
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
  const user = req.session && req.session.user ? req.session.user.id : null;

  try {
    await client.connect();
    const trips = await findTripByDate(destination, date, user);
    console.log("user");
    console.log(user);
    console.log(trips);
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

async function findTripByDate(destination, date, user) {
  try {
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);
    const trips = await collection.find({
      destination,
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) },
      user: { $ne: new ObjectId(user) } // Exclude trips created by the current user
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
  
  const user = req.session? req.session.user ? req.session.user.id : null : null;

  console.log(req.session);
  console.log(req.session.user);
  console.log(user);


  try {
    await client.connect();
    const trips = await findTripsByUserId(user);
    // if (!trips || trips.length === 0) {
    //   return res.status(404).json({ message: 'No trips found for this user' });
    // }
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
// PUT route to edit a trip

router.put('/edit_trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const {
    destination, startDate, endDate,
    startLocation, endLocation, totalMembers, budget,age, sex,
    description, destinationImages
  } = req.body;

  const user = req.session && req.session.user ? req.session.user.id : null;
  
  if (!user) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    // Ensure the tripId is a valid ObjectId
    if (!ObjectId.isValid(tripId)) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    // Find the trip by ID to check user access
    const createdBy = await findTripById(tripId);

    console.log(createdBy);
    if (!createdBy) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    console.log(user);
    const userId = new ObjectId(user);
    if (!createdBy.user.equals(userId)) {
      // The user is different
      return res.status(403).json({ error: "You don't have access to edit this trip" });
    }
    const ageNumber = Number(age);
    const totalMembersNumber = Number(totalMembers);

    const newTrip = {
      destination, startDate, endDate,
      startLocation, endLocation, totalMembers: totalMembersNumber,budget, age: ageNumber, sex,
      description, destinationImages
    };
    console.log(newTrip);
    const result = await updateTrip(newTrip, tripId);

    if (!result.value) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip updated successfully', trip: result.value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function updateTrip(newTrip, tripId) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);
    const tripUpdated = await collection.findOneAndUpdate(
      { _id: new ObjectId(tripId) },
      { $set: newTrip },
      { returnOriginal: false } // To return the updated document
    );
    return tripUpdated;
  } finally {
    await client.close();
  }
}

async function findTripById(tripId) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);
    const trip = await collection.findOne({ _id: new ObjectId(tripId) });
    return trip;
  } finally {
    await client.close();
  }
}

module.exports = router;