const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForUserProfiles = process.env.COLLECTION_FOR_USER_PROFILES;
const express = require("express");
const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const jsonParser = require("body-parser").json();

console.log(urlForMongoDB, databaseName, collectionForUserProfiles);

const { MongoClient } = require("mongodb");
const client = new MongoClient(urlForMongoDB);

function isValidEmail(emailId) {
  return emailRegex.test(emailId);
}

router.get("/getUserProfile", async (req, res) => {
  console.log("request came");

  try {
    const emailId = req.query.emailId;

    console.log(emailId);

    if (!isValidEmail(emailId)) {
      res.status(400).json("Email Id not valid");
      return;
    }

    // Fetch user by emailId
    const user = await getUserByEmailId(emailId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/createUserProfile", jsonParser, async (req, res) => {
  try {
    const emailId = req.body.emailId;
    const newUser = req.body;

    if (!isValidEmail(emailId)) {
      res.status(400).json("Email Id not valid");
      return;
    }

    // Check if user with given emailId already exists
    const existingUser = await getUserByEmailId(emailId);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with given EmailId already exists" });
    }

    // Create new user
    await createUser(newUser);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

async function getUserByEmailId(emailId) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionForUserProfiles);
    const result = await collection.findOne({ _id: emailId });
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
    const newUser = { ...user, _id: user.emailId };
    console.log(newUser);
    delete newUser.emailId;
    console.log(newUser);
    const userCreated = await collection.insertOne(newUser);
    return userCreated;
  } finally {
    await client.close();
  }
}

module.exports = router;
