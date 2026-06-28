const { Worker } = require("bullmq");
const { getRedisClient } = require("../config/redis");

const connection = getRedisClient();

// Worker definitions
const workers = {};

/**
 * Create a worker for a specific queue
 */
function createWorker(queueName, processor, options = {}) {
  if (workers[queueName]) {
    return workers[queueName];
  }

  const worker = new Worker(queueName, processor, {
    connection,
    concurrency: options.concurrency || 1,
    ...options,
  });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} in queue ${queueName} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} in queue ${queueName} failed:`, err.message);
  });

  workers[queueName] = worker;
  return worker;
}

/**
 * Get a worker by name
 */
function getWorker(queueName) {
  return workers[queueName];
}

/**
 * Close all workers
 */
async function closeAllWorkers() {
  await Promise.all(Object.values(workers).map((worker) => worker.close()));
  console.log("All workers closed");
}

module.exports = {
  createWorker,
  getWorker,
  closeAllWorkers,
};
