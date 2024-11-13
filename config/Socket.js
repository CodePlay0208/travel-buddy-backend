const chatRepository = require('../repositories/ChatRepository');

const handleSocketIO = (server) => {
  const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.ORIGIN_FOR_CLIENT.split(","),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", (userData) => {
      try {
        socket.join(userData.userId);
        socket.userData = userData; 
        socket.emit("connected");
      } catch (error) {
        console.error("Error in setup event:", error);
        socket.emit("error", "Setup failed");
      }
    });

    socket.on("join chat", (room) => {
      console.log('room', room)
      const { roomId, userId } = room
      try {
      
        const roomSockets = io.sockets.adapter.rooms.get(roomId);

        if (roomSockets) {
          console.log(`Users in room before joining ${roomId}:`);
          roomSockets.forEach((socketId) => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket && socket.userData) {
              console.log(socket.userData); 
            }
          });
        } else {
          console.log(`Room ${roomId} is empty or does not exist.`);
        }

        if (roomSockets) {
          const userAlreadyInRoom = Array.from(roomSockets).some((socketId) => {
            const connectedSocket = io.sockets.sockets.get(socketId);
            return connectedSocket?.userData?.userId === userId;
          });

          if (userAlreadyInRoom) {
            console.log(`User ${userId} is already in Room: ${(roomId)}`);
            return; 
          }
        }

        socket.join(roomId);

        const updatedRoomSockets = io.sockets.adapter.rooms.get(roomId);
        if (updatedRoomSockets) {
          const usersInRoom = Array.from(updatedRoomSockets).map((socketId) => {
            const connectedSocket = io.sockets.sockets.get(socketId);
            return connectedSocket?.userData; 
          });

          console.log("Users in room after joining:", usersInRoom);
        }

      } catch (error) {
        console.error("Error in join chat event:", error);
        socket.emit("error", "Join chat failed");
      }
    });

    socket.on("typing", (room) => {
      try {
        socket.to(room).emit("typing");
        console.log("The user is typing", room);
      } catch (error) {
        console.error("Error in typing event:", error);
        socket.emit("error", "Typing event failed");
      }
    });

    socket.on("stop typing", (room) => {
      try {
        socket.to(room).emit("stop typing")
        console.log("The user has stopped typing", room);
      } catch (error) {
        console.error("Error in stop typing event:", error);
        socket.emit("error", "Stop typing event failed");
      }
    });

    socket.on("new message", async (newMessageReceived) => {
      console.log("new messsage event", newMessageReceived);
      try {
        const chatId = newMessageReceived.chatId;
        var chat = await chatRepository.findChatsByChatId(chatId)

        if (!chat.users) {
          return;
        }

        chat.users.forEach((user) => {
          if (user === newMessageReceived.senderId) return;
          console.log('sending to user', user)
          socket.to(user).emit("message received", newMessageReceived);
        });
      } catch (error) {
        console.error("Error in new message event:", error);
        socket.emit("error", "New message event failed");
      }
    });

    socket.off("setup", () => {
      socket.leave(userData.userId);
    });
  });
};

module.exports = handleSocketIO;
