const { MongoClient, ObjectId } = require('mongodb');
const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForTrip = process.env.COLLECTION_FOR_TRIPS_DATA;
const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const client = new MongoClient(urlForMongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
router.use(bodyParser.json());
router.delete('/deleteTrip/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.session && req.session.user ? req.session.user.id : null;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const trip = await findAndDelete(tripId, userId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or you do not have permission to delete this trip.' });
    }

    res.status(200).json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while deleting the trip.' });
  }
});

async function findAndDelete(tripId, userId) {
  try {
    const database = client.db(databaseName);
    const collection = database.collection(collectionForTrip);

    const trip = await collection.findOne({ _id: new ObjectId(tripId), user: new ObjectId(userId) });

    if (!trip) {
      return null;
    }

    await collection.deleteOne({ _id: new ObjectId(tripId) });
    return trip;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = router;
