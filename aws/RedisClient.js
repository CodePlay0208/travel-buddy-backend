const { createClient } = require('redis');

const redisOptions = {
  url: process.env.REDIS_URL
};
if (process.env.REDIS_PASSWORD) {
  redisOptions.password = process.env.REDIS_PASSWORD;
}

const redisClient = createClient(redisOptions);
redisClient.on('error', (err) => console.error('Redis Client Error', err));

module.exports = redisClient;
