require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 4000;
const { OAuth2Client } = require("google-auth-library");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const crypto = require("crypto");
const cors = require("cors");

const loginController = require("./Controller/LoginController");
const userController = require("./Controller/UserController");
const tripsController = require("./Controller/TripsDataController");
const chatController = require("./Controller/ChatController");
const messageController = require("./Controller/MessageController");



const secretKeyForSession = crypto.randomBytes(64).toString("hex");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, // This allows the session cookie to be sent and received
};

app.use(cors(corsOptions));
app.use(express.json());

const store = new MongoDBStore({
  uri: process.env.URL_FOR_MONGODB + process.env.DATABASE_NAME,
  collection: "sessions",
  // Optionally, MongoDB connection options can be added here
});

console.log(store.uri);

// Catch MongoDB connection errors
store.on("error", (error) => {
  console.error("MongoDB session store connection error:", error);
});

app.use(
  session({
    store: store,
    secret: secretKeyForSession,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
      httpOnly: false, // Allows JavaScript to access the cookie
      sameSite: "lax",
    }, // Set secure: true in production
  })
);

app.use("/login", loginController);
app.use("/user", userController);
app.use("/api", tripsController);
app.use("/chat", chatController);
app.use("/message", messageController);

// MongoDB connection
mongoose
  .connect(process.env.URL_FOR_MONGODB + process.env.DATABASE_NAME, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log("MongoDB connection error:", err));


const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

