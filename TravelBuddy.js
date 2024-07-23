require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const crypto = require("crypto");
const cors = require("cors");
const loginRoute = require("./routes/LoginRoute");
const userProfileRoute = require("./routes/UserProfileRoute");
const tripsDataRoute = require("./routes/TripsDataRoute");
const chatRoute = require("./routes/ChatRoute");
const messageRoute = require("./routes/MessageRoute");
const {notFound} = require("./middleware/ErrorMiddleware");
const {errorHandler} = require("./middleware/ErrorMiddleware");
const handleSocketIO = require("./config/Socket");
const connectDB = require("./config/Database");
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

const isJwtSecretKeyPresent = () => {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    return envContent.includes('JWT_SECRET_KEY');
  } catch (err) {
    return false;
  }
};

if (!isJwtSecretKeyPresent()) {
  const jwtSecretKey = crypto.randomBytes(64).toString('hex');
  fs.appendFileSync(envPath, `JWT_SECRET_KEY=${jwtSecretKey}\n`);
}

const corsOptions = {
  origin: process.env.ORIGIN_FOR_CLIENT,
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(express.json());

// connectDB();

app.use("/login", loginRoute);
app.use("/user", userProfileRoute);
app.use("/trips", tripsDataRoute);
app.use("/chat", chatRoute);
app.use("/message", messageRoute);
app.use(notFound);
app.use(errorHandler);


const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

handleSocketIO(server);