require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 4000;
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const crypto = require('crypto');
const cors = require('cors');

const loginController = require('./Controller/LoginController');
const userController = require('./Controller/UserController');
const tripsController = require('./Controller/TripsDataController');

const secretKeyForSession = crypto.randomBytes(64).toString('hex');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, // This allows the session cookie to be sent and received
};

app.use(cors(corsOptions));
app.use(express.json());



const store = new MongoDBStore({
  uri: process.env.URL_FOR_MONGODB + process.env.DATABASE_NAME,
  collection: 'sessions',
  // Optionally, MongoDB connection options can be added here
});

console.log(store.uri);

// Catch MongoDB connection errors
store.on('error', error => {
  console.error('MongoDB session store connection error:', error);
});

app.use(session({
  store: store,
  secret: secretKeyForSession,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 } // Set secure: true in production
}));

app.use('/login', loginController);
app.use('/user', userController);
app.use('/api', tripsController);

// MongoDB connection
mongoose.connect(process.env.URL_FOR_MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log('MongoDB connection error:', err));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
