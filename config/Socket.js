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
        socket.userData = userData; // Store userData on the socket object
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
        // console.log('--------join chat-------------')
        const roomSockets = io.sockets.adapter.rooms.get(roomId);

        if (roomSockets) {
          console.log(`Users in room before joining ${roomId}:`);
          roomSockets.forEach((socketId) => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket && socket.userData) {
              console.log(socket.userData); // Print the user data
            }
          });
        } else {
          console.log(`Room ${roomId} is empty or does not exist.`);
        }

        // const roomSockets = io.sockets.adapter.rooms.get(room);
        // if (roomSockets) {
        //   const usersInRoom = Array.from(roomSockets).map((socketId) => {
        //     const connectedSocket = io.sockets.sockets.get(socketId);
        //     return connectedSocket?.userData; // Return userData if stored on the socket
        //   });
        //
        //   console.log("Users in room:", usersInRoom);
        // }

        if (roomSockets) {
          const userAlreadyInRoom = Array.from(roomSockets).some((socketId) => {
            const connectedSocket = io.sockets.sockets.get(socketId);
            return connectedSocket?.userData?.userId === userId;
          });

          if (userAlreadyInRoom) {
            console.log(`User ${userId} is already in Room: ${(roomId)}`);
            return; // Exit the function if the user is already in the room
          }
        }

        // Store user data on the socket to track them
        // socket.userData = { userId }; // Store userId or other relevant data on the socket
        // socket.join(chatId);
        // console.log("User Joined Room: " + JSON.stringify(chatId));
        //

        socket.join(roomId);

        // Retrieve all users in the room after joining
        const updatedRoomSockets = io.sockets.adapter.rooms.get(roomId);
        if (updatedRoomSockets) {
          const usersInRoom = Array.from(updatedRoomSockets).map((socketId) => {
            const connectedSocket = io.sockets.sockets.get(socketId);
            return connectedSocket?.userData; // Return userData if stored on the socket
          });

          console.log("Users in room after joining:", usersInRoom);
        }

        // const roomSockets = io.sockets.adapter.rooms.get(room);
        // if (roomSockets) {
        //   const usersInRoom = Array.from(roomSockets).map((socketId) => {
        //     const connectedSocket = io.sockets.sockets.get(socketId);
        //     return connectedSocket?.userData; // Return userData if stored on the socket
        //   });
        //
        //   console.log("Users in room AFTER JOINING:", usersInRoom);
        // }

      } catch (error) {
        console.error("Error in join chat event:", error);
        socket.emit("error", "Join chat failed");
      }
    });

    socket.on("typing", (room) => {
      try {
        // const { chatId, userId } = room
        // console.log('chatID userId', chatId, userId)
        // var chat = await chatRepository.findChatsByChatId(chatId)
        //
        // if (!chat?.users) {
        //   console.log("chat.users not defined");
        //   return;
        // }
        //
        // chat?.users.forEach((user) => {
        //   if (user === userId) return
        //   // console.log('user', user)
        //   socket.to(user).emit("typing");
        // })
        socket.in(room).emit("typing");
      } catch (error) {
        console.error("Error in typing event:", error);
        socket.emit("error", "Typing event failed");
      }
    });

    socket.on("stop typing", (room) => {
      try {
        // const { chatId, userId } = room
        // var chat = await chatRepository.findChatsByChatId(chatId)
        //
        // if (!chat?.users) {
        //   console.log("chat.users not defined");
        //   return;
        // }
        //
        // chat?.users.forEach((user) => {
        //   if (user === userId) return
        //   // console.log('user', user)
        //   socket.to(user).emit("stop typing");
        // })
        socket.in(room).emit("stop typing")

      } catch (error) {
        console.error("Error in stop typing event:", error);
        socket.emit("error", "Stop typing event failed");
      }
    });

    socket.on("new message", async (newMessageReceived) => {
      console.log("new messsage event", newMessageReceived);
      try {
        const chatId = newMessageReceived.chatId;
        // console.log(newMessageReceived);
        var chat = await chatRepository.findChatsByChatId(chatId)

        if (!chat.users) {
          return;
        }

        chat.users.forEach((user) => {
          if (user === newMessageReceived.senderId) return;
          console.log('sending to user', user)
          socket.to(user).emit("message received", newMessageReceived);
        });
        // socket.in(chatId).emit("message received", newMessageReceived);
      } catch (error) {
        console.error("Error in new message event:", error);
        socket.emit("error", "New message event failed");
      }
    });

    // socket.on("disconnect", () => {
    //   console.log('--------disconnect-------------')
    //   try {
    //     console.log("USER DISCONNECTED");
    //     if (socket.userData) {
    //       console.log('socket.userData disconnected', socket.userData);
    //       socket.leave(socket.userData.userId);
    //     }
    //   } catch (error) {
    //     console.error("Error in disconnect event:", error);
    //   }
    // });
    socket.off("setup", () => {
      socket.leave(userData.userId);
    });
  });
};

module.exports = handleSocketIO;
