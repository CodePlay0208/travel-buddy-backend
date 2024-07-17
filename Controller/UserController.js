const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForUserProfiles = process.env.COLLECTION_FOR_USER_PROFILES;
const { MongoClient, ObjectId } = require("mongodb");

const jsonParser = require("body-parser").json();

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const UserProfile = require("../models/UserProfile");
const bodyParser = require("body-parser");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const { getUserById, isValidEmail, createUser } = require("../Utils");

const fetch = require("node-fetch");

console.log(urlForMongoDB, databaseName, collectionForUserProfiles);

router.use(bodyParser.json());

const passport = require("passport");
const client = new MongoClient(urlForMongoDB);

router.post("/createUserProfile", async (req, res) => {
  const { username, password, emailId } = req.body;

  if (!isValidEmail(emailId)) {
    return res.status(400).json({ message: "Email Id not valid" });
  }

  try {
    const existingUser = await getUserByEmailId(emailId);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with given EmailId already exists" });
    }

    const newUser = new UserProfile({ username, password, emailId });
    await createUser(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.get('/getUserProfile', async (req, res) => {
  const userId = req.session && req.session.user ? req.session.user.id : null;
  console.log('the user id is, ' ,userId);
  console.log('the session  is, ' ,req.session);
  if (!userId ) {
    return res.status(400).json({ message: 'Email Id not valid' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.put('/edit_user', async (req, res) => {
  // const { userId } = req.params;
  const { username, age, sex, address } = req.body;

  const userId = req.session && req.session.user ? req.session.user.id : null;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    
    const currentUserProfile = await getUserById(userId);

    if (!currentUserProfile) {
      return res.status(404).json({ error: 'User not found' });
    }


    const newUserProfile = {
      username, age, sex, address
    };
    console.log("newUserProfile");
    console.log(newUserProfile);
    const result = await updateUserProfile(newUserProfile, userId);
    console.log(result);

    
    res.json({ message: 'User profile updated successfully', user: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function updateUserProfile(newUserProfile, userId) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionForUserProfiles);
    const userUpdated = await collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: newUserProfile },
      { returnOriginal: false } // To return the updated document
    );
    return userUpdated;
  } finally {
    await client.close();
  }
}
module.exports = router;