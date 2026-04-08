const { Worker } = require('bullmq');
const axios = require('axios');
const Notification = require('../models/Notification');
const { connection } = require('./queue');

const startWorker = () => {
  const worker = new Worker(
    'discrepancy-notifications',
    async (job) => {
      const {
        merchantId,
        awbNumber,
        discrepancyType,
        expectedValue,
        actualValue,
        suggestedAction,
        settlementId,
      } = job.data;

      const webhookUrl = process.env.WEBHOOK_URL;

      // Find or create notification record
      let notification = await Notification.findOne({ awbNumber, discrepancyType });

      if (!notification) {
        notification = await Notification.create({
          merchantId,
          awbNumber,
          discrepancyType,
          expectedValue,
          actualValue,
          suggestedAction,
          status: 'RETRYING',
          attempts: 0,
          jobId: settlementId,
        });
      }

      // Update attempt count
      notification.attempts += 1;
      notification.lastAttemptAt = new Date();

      try {
        await axios.post(webhookUrl, {
          merchantId,
          awbNumber,
          discrepancyType,
          expectedValue,
          actualValue,
          suggestedAction,
          timestamp: new Date().toISOString(),
        });

        notification.status = 'SENT';
        await notification.save();
        console.log(`✅ Notification sent for AWB: ${awbNumber}`);

      } catch (err) {
        notification.status = 'FAILED';
        await notification.save();
        console.error(`❌ Notification failed for AWB: ${awbNumber} — ${err.message}`);
        throw err; // BullMQ will retry
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('🚀 Notification worker started');
  return worker;
};

module.exports = { startWorker };