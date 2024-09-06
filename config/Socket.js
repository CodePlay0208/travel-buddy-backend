const handleSocketIO = (server) => {
  const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.ORIGIN_FOR_CLIENT,
      // credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", (userData) => {
      try {
        socket.join(userData._id);
        socket.userData = userData; // Store userData on the socket object
        socket.emit("connected");
      } catch (error) {
        console.error("Error in setup event:", error);
        socket.emit("error", "Setup failed");
      }
    });

    socket.on("join chat", (room) => {
      try {
        socket.join(room);
        console.log("User Joined Room: " + room);
      } catch (error) {
        console.error("Error in join chat event:", error);
        socket.emit("error", "Join chat failed");
      }
    });

    socket.on("typing", (room) => {
      try {
        socket.in(room).emit("typing");
      } catch (error) {
        console.error("Error in typing event:", error);
        socket.emit("error", "Typing event failed");
      }
    });

    socket.on("stop typing", (room) => {
      try {
        socket.in(room).emit("stop typing");
      } catch (error) {
        console.error("Error in stop typing event:", error);
        socket.emit("error", "Stop typing event failed");
      }
    });

    socket.on("new message", (newMessageRecieved) => {
      try {
        var chat = newMessageRecieved.chat;

        if (!chat.users) {
          console.log("chat.users not defined");
          return;
        }

        chat.users.forEach((user) => {
          if (user._id == newMessageRecieved.sender._id) return;

          socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
      } catch (error) {
        console.error("Error in new message event:", error);
        socket.emit("error", "New message event failed");
      }
    });

    socket.on("disconnect", () => {
      try {
        console.log("USER DISCONNECTED");
        if (socket.userData) {
          socket.leave(socket.userData._id);
        }
      } catch (error) {
        console.error("Error in disconnect event:", error);
      }
    });
  });
};

module.exports = handleSocketIO;
