const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForUserProfiles = process.env.COLLECTION_FOR_USER_PROFILES;

const jsonParser = require("body-parser").json();

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const bodyParser = require('body-parser');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



console.log(urlForMongoDB, databaseName, collectionForUserProfiles);

router.use(bodyParser.json());

const { MongoClient } = require("mongodb");
const passport = require("passport");
const client = new MongoClient(urlForMongoDB);

function isValidEmail(emailId) {
  return emailRegex.test(emailId);
}

router.post('/createUserProfile', async (req, res) => {
  const { username, password, emailId } = req.body;

  if (!isValidEmail(emailId)) {
    return res.status(400).json({ message: 'Email Id not valid' });
  }

  try {
    const existingUser = await getUserByEmailId( emailId );
    if (existingUser) {
      return res.status(400).json({ message: 'User with given EmailId already exists' });
    }

    const newUser = new UserProfile({ username, password, emailId });
    await createUser(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

router.get('/getUserProfile', async (req, res) => {
  const userId = req.session && req.session.user ? req.session.user.id : null;
  
  if (!userId ) {
    return res.status(400).json({ message: 'Email Id not valid' });
  }

  try {
    const user = await getUserByUserId(userId);
    console.log(user);
    console.log("user");
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

async function getUserByUserId(userId) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionForUserProfiles);
    const result = await collection.findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );
    return result;
  } finally {
    await client.close();
  }
}
  
  async function createUser(user) {
    try {
      await client.connect();
      const database = client.db(databaseName);
      const collection = database.collection(collectionForUserProfiles);
      
      const userCreated = await collection.insertOne(user);
      return userCreated;
    } finally {
      await client.close();
    }
  }
module.exports = router;
