// Usage: node scripts/checkUserTripsForTripInstance.js <tripInstanceId>
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const UserTrips = require('../models/UserTripsModel');

const tripInstanceId = process.argv[2];
if (!tripInstanceId) {
  console.error('Usage: node scripts/checkUserTripsForTripInstance.js <tripInstanceId>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.URL_FOR_MONGODB, {
    dbName: process.env.DATABASE_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Checking UserTrips for tripInstanceId:', tripInstanceId);

  const all = await UserTrips.find({ tripInstanceId }).lean();
  const joined = await UserTrips.find({ tripInstanceId, isJoined: true }).lean();

  console.log('All userTrips for tripInstanceId:', all);
  console.log('userTrips with isJoined: true:', joined);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
