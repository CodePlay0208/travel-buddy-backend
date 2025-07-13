// Simple in-memory cache using node-cache
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // 60s TTL

module.exports = cache;
