const { createClient } = require("redis");

const redisOptions = {
  url: process.env.REDIS_URL,
  socket: {
    tls: true  
  }
};

const redisClient = createClient(redisOptions);
redisClient.on("error", (err) => console.error("There is a error", err));
redisClient.on("connect", () => {
  console.log("✅ Redis client connected successfully");
});

module.exports = redisClient;
