const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const discrepancyQueue = new Queue('discrepancy-notifications', { connection });

const publishDiscrepancyEvent = async (payload) => {
  await discrepancyQueue.add('notify-merchant', payload, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  });
  console.log(`📤 Event published for AWB: ${payload.awbNumber} — ${payload.discrepancyType}`);
};

module.exports = { publishDiscrepancyEvent, discrepancyQueue, connection };