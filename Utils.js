
const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForUserProfiles = process.env.COLLECTION_FOR_USER_PROFILES;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient(urlForMongoDB);


async function getUserById(userId) {
  userId = new ObjectId(userId);
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

function isValidEmail(emailId) {
  return emailRegex.test(emailId);
}

module.exports = { getUserById, createUser, isValidEmail };
