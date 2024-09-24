const mongoose = require("mongoose");
const TripDataModel = require("../models/TripDataModel");
const TempUserSignUpModel = require("../models/TempUserSignUpModel");
const OtpModel = require("../models/OtpModel");
const logger = require("../Logger");


const listAllIndexes = async () => {
  const db = mongoose.connection.db; 

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
    logger.info("Connecting to database...");
    const conn = await mongoose.connect(
      process.env.URL_FOR_MONGODB + process.env.DATABASE_NAME,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to database`);
    throw new Error("Error connecting to database", error);
  }
};

const createIndexes = async () => {
  try {
    logger.info(`Creating indexes in the database`);
    TripDataModel.createIndexes();
    TempUserSignUpModel.createIndexes();
    OtpModel.createIndexes();
  } catch (error) {
    logger.error(`Error creating indexes`);
    throw new Error("Error while creating indexes", error);
  }
};

const initializeDB = async () => {
  try {
    connectDB();
    createIndexes();
  } catch (error) {
    logger.error("Error while initializing database");
    process.exit(1);
  }
};

module.exports = initializeDB;
