require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");
const loginRoute = require("./routes/LoginRoute");
const userProfileRoute = require("./routes/UserProfileRoute");
const tripsDataRoute = require("./routes/TripsDataRoute");
const chatRoute = require("./routes/ChatRoute");
const messageRoute = require("./routes/MessageRoute");
const miscRoute = require("./routes/MiscRoute");
const locationRoute = require("./routes/LocationRoute");
const partnersRoute = require("./routes/PartnersRoute");
const notificationRoute = require("./routes/NotificationRoute");
const { notFound } = require("./middleware/ErrorMiddleware");
const { errorHandler } = require("./middleware/ErrorMiddleware");
const handleSocketIO = require("./config/Socket");
const initializeDB = require("./repositories/Config");
const logger = require("./logger");
const {
  requestContextMiddleware,
} = require("./middleware/RequestContextMiddleware");


try {
  const allowedOrigins = process.env.ORIGIN_FOR_CLIENT.split(",");
  logger.info(`The allowed origins are=${JSON.stringify(allowedOrigins)}`);
  const corsOptions = {
    origin: (origin, callback) => {
      
      if (!origin || allowedOrigins.includes(origin)) {
        logger.info(`The origin is=${origin}`)
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));
  app.use(requestContextMiddleware);

  initializeDB();

  app.use("/login", loginRoute);
  app.use("/user", userProfileRoute);
  app.use("/trips", tripsDataRoute);
  app.use("/chat", chatRoute);
  app.use("/message", messageRoute);
  app.use("/location", locationRoute);
  app.use("/misc", miscRoute);
  app.use("/partners", partnersRoute);
  app.use("/notification", notificationRoute);
  app.get('/health/status', (req, res) => {
    logger.info(`Responding to Health Check Status`)
    res.status(200).send('OK'); 
});
  // Register blogs API route
  const blogRoute = require("./routes/BlogRoute");
  app.use("/blogs", blogRoute);

  app.get("/health/status", (req, res) => {
    logger.info(`Responding to Health Check Status`);
    res.status(200).send("OK");
  });

  // Optionally, add a root route for `/` to avoid Not Found error on `/`
  app.get("/", (req, res) => {
    res.status(200).send("API is running");
  });

  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });

  // handleSocketIO(server);
} catch (error) {
  logger.error(`Error while running the app: ${error.message}`, {
    stack: error.stack,
  });
}
