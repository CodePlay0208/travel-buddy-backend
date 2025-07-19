const { createClient } = require('redis');

const redisOptions = {
  url: process.env.REDIS_URL
};

const redisClient = createClient(redisOptions);
redisClient.on('error', (err) => console.error('There is a error', err));

module.exports = redisClient;
