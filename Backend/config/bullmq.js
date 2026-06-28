const { Queue, Worker, Scheduler } = require("bullmq");
const { getRedisClient, isRedisAvailable } = require("./redis");

let connection;
let queues = {};
let queuesInitialized = false;

// Initialize queues only if Redis is available
try {
  connection = getRedisClient();
  if (isRedisAvailable()) {
    queues = {
      aiPipeline: new Queue("ai-pipeline", { connection }),
      embedding: new Queue("embedding", { connection }),
      slaCheck: new Queue("sla-check", { connection }),
      notification: new Queue("notification", { connection }),
      churnPredict: new Queue("churn-predict", { connection }),
    };
    queuesInitialized = true;
    console.log("BullMQ queues initialized");
  } else {
    console.log("Redis not available, BullMQ queues disabled");
  }
} catch (error) {
  console.log("Failed to initialize BullMQ queues:", error.message);
}

// Queue options
const queueOptions = {
  aiPipeline: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
  embedding: {
    attempts: 5,
    backoff: {
      type: "fixed",
      delay: 1000,
    },
  },
  slaCheck: {
    repeat: {
      every: 60000, // Every 60 seconds
    },
    removeOnComplete: 10,
  },
  notification: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
  churnPredict: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
};

/**
 * Add job to queue
 */
async function addJob(queueName, jobName, data, options = {}) {
  if (!queuesInitialized) {
    console.log(`Queue ${queueName} not available (Redis disabled)`);
    return null;
  }

  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const jobOptions = { ...queueOptions[queueName], ...options };
  return await queue.add(jobName, data, jobOptions);
}

/**
 * Get queue by name
 */
function getQueue(queueName) {
  return queues[queueName];
}

/**
 * Get all queues
 */
function getAllQueues() {
  return queues;
}

/**
 * Close all queues
 */
async function closeAllQueues() {
  if (queuesInitialized) {
    await Promise.all(Object.values(queues).map((queue) => queue.close()));
    console.log("All BullMQ queues closed");
  }
}

module.exports = {
  queues,
  queueOptions,
  addJob,
  getQueue,
  getAllQueues,
  closeAllQueues,
  queuesInitialized,
};
