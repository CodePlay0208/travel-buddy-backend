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
    logger.info(
      `Indexes for collection=${collectionName}, indexes=${JSON.stringify(
        indexes
      )}`
    );
  }
};

const dropAllIndexes = async () => {
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();

  for (const collection of collections) {
    const collectionName = collection.name;
    const collectionObj = db.collection(collectionName);
    collectionObj.dropIndexes();
    logger.info(`Dropped Indexes for collection=${collectionName}`);
  }
};

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
    await TripDataModel.createIndexes();
    await TempUserSignUpModel.createIndexes();
    await OtpModel.createIndexes();
    logger.info(`Created indexes in the database`);
  } catch (error) {
    logger.error(`Error creating indexes, error=${error}`);
    throw new Error("Error while creating indexes", error);
  }
};

const initializeDB = async () => {
  try {
    await connectDB();
    await createIndexes();
  } catch (error) {
    logger.error("Error while initializing database");
    process.exit(1);
  }
};

module.exports = initializeDB;
