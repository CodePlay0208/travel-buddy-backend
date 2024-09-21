const mongoose = require("mongoose");
const UserProfile = require("../../models/UserProfileModel");
const TripDataModel = require("../../models/TripDataModel");
const TempUserSignUpModel = require("../../models/TempUserSignUpModel");
const OtpModel = require("../../models/OtpModel");
const NewsletterSubscriptionUserModel = require("../../models/NewsletterSubscriptionUserModel");

const listAllIndexes = async () => {
  const db = mongoose.connection.db; // Get the database object

  // Get all collections in the database
  const collections = await db.listCollections().toArray();

  for (const collection of collections) {
    const collectionName = collection.name;
    const indexes = await db.collection(collectionName).indexes();

    console.log(`Indexes for collection ${collectionName}:`);
    console.log(indexes);
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.URL_FOR_MONGODB + process.env.DATABASE_NAME,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    throw new Error("Error connecting to database", error);
  }
};

const createIndexes = async () => {
  try {
    TripDataModel.createIndexes();
    TempUserSignUpModel.createIndexes();
    OtpModel.createIndexes();
  } catch (error) {
    throw new Error("Error while creating indexes", error);
  }
};

const initializeDB = async () => {
  try {
    connectDB();
    createIndexes();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }
};

module.exports = initializeDB;
