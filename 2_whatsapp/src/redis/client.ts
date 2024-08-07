import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

const client = createClient({
  url: `redis://${redisHost}:${redisPort}`,
});
client.on("error", (err) => console.log("\n\nRedis Client Error\n\n", err));

client.connect();
console.log(`Redis Client connected`);

export default client;
