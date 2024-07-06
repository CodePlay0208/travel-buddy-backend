require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT;
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');
const client = new OAuth2Client('464876682696-pkm7moinvftntbnild9dq19378vu3ski.apps.googleusercontent.com');
const loginController = require('./Controller/LoginController');
const userController = require('./Controller/UserController');
const cors = require('cors');
const MongoDBStore = require('connect-mongodb-session')(session);
const crypto = require('crypto');
const secretKeyForSession = crypto.randomBytes(64).toString('hex');


const corsOptions = {
  origin: 'http://localhost:3000', 
  credentials: true, // This allows the session cookie to be sent and received
};




app.use(cors(corsOptions));

const store = new MongoDBStore({
  uri: 'mongodb://localhost:4001/TravelBuddyDataBase', // MongoDB URI
  collection: 'sessions', // Collection name for sessions
  // Optionally, MongoDB connection options
  mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
});

// Catch MongoDB connection errors
store.on('error', error => {
  console.error('MongoDB session store connection error:', error);
});

app.use(session({
  store: store,
  secret: secretKeyForSession,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure: true in production
}));

app.use(express.json());

app.use('/login' , loginController);
app.use('/user' , userController);



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});