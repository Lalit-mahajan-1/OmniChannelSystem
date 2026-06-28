const Redis = require("ioredis");

let redisClient;
let redisAvailable = false;

function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 2) {
          console.log("Redis connection failed, running without Redis");
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: false,
    });

    redisClient.on("connect", () => {
      console.log("Redis client connected");
      redisAvailable = true;
    });

    redisClient.on("error", (error) => {
      if (!redisAvailable) {
        console.log("Redis connection failed, running without Redis cache");
      }
    });

    redisClient.on("close", () => {
      console.log("Redis client connection closed");
      redisAvailable = false;
    });
  }

  return redisClient;
}

function isRedisAvailable() {
  return redisAvailable;
}

async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    console.log("Redis client closed");
    redisAvailable = false;
  }
}

module.exports = { getRedisClient, closeRedisClient, isRedisAvailable };
