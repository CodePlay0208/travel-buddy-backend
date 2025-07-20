const chatRepository = require("../repositories/ChatRepository");
const redisClient = require("../aws/RedisClient");
const { createAdapter } = require("@socket.io/redis-adapter");
const AWS = require("aws-sdk");

const kinesis = new AWS.Kinesis({
  region: process.env.KINESIS_STREAM_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const KINESIS_STREAM_NAME = process.env.KINESIS_STREAM_NAME;

const handleSocketIO = (server) => {
  const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.ORIGIN_FOR_CLIENT.split(","),
      credentials: true,
    },
  });

  
  io.adapter(createAdapter(redisClient, redisClient.duplicate()));

  io.on("connection", (socket) => {
    socket.on("joinChat", (room) => {
      const { chatId } = room;
      socket.join(chatId);
      console.log(`${socket.id} joined room ${userId}`);
    });

    socket.on("newMessage", async (message) => {
      const { senderId, messageId, chatId, content } = message;
      console.log("new Message recieved", message)
      socket.to(chatId).emit("newMessage", message);
      try {
        await kinesis
          .putRecord({
            StreamName: KINESIS_STREAM_NAME,
            PartitionKey: socket.id,
            Data: Buffer.from(JSON.stringify(message)),
          })
          .promise();
      } catch (err) {
        console.error("Error publishing to Kinesis:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = handleSocketIO;
