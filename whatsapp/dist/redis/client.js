"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const client = (0, redis_1.createClient)({
    url: `redis://${redisHost}:${redisPort}`,
});
client.on("error", (err) => console.log("\n\nRedis Client Error\n\n", err));
client.connect();
exports.default = client;
