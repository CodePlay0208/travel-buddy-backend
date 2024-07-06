require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT;

const userController = require('./Controller/UserProfileController');
const tripsController = require('./Controller/TripsDataController');

// MongoDB connection
mongoose.connect(process.env.URL_FOR_MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log('MongoDB connection error:', err));

app.use('/user', userController);
app.use('/api', tripsController);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
