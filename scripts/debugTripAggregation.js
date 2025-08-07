// Usage: node scripts/debugTripAggregation.js <tripInstanceId>
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TripInstance = require('../models/TripInstanceModel');

const tripInstanceId = process.argv[2];
if (!tripInstanceId) {
  console.error('Usage: node scripts/debugTripAggregation.js <tripInstanceId>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.URL_FOR_MONGODB, {
    dbName: process.env.DATABASE_NAME,
  });

  console.log('Running aggregation for tripInstanceId:', tripInstanceId);

  const pipeline = [
    { $match: { tripInstanceId: tripInstanceId } },
    // Force tripInstanceId to string for join reliability
    { $addFields: { tripInstanceId: { $toString: "$tripInstanceId" } } },
    {
      $lookup: {
        from: "usertrips",
        let: { tripInstanceId: "$tripInstanceId" },
        pipeline: [
          { $addFields: { tripInstanceId: { $toString: "$tripInstanceId" } } },
          { $match: {
              $expr: {
                $and: [
                  { $eq: ["$tripInstanceId", "$$tripInstanceId"] },
                  { $eq: ["$isJoined", true] }
                ]
              }
            }
          }
        ],
        as: "userTripsData"
      }
    },
    { $addFields: { memberCount: { $size: "$userTripsData" } } },
    { $project: { tripInstanceId: 1, userTripsData: 1, memberCount: 1 } }
  ];

  const result = await TripInstance.aggregate(pipeline);
  console.log('Aggregation result:', JSON.stringify(result, null, 2));

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
