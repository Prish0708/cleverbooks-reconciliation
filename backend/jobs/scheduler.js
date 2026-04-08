const cron = require('node-cron');
const { runReconciliation } = require('../services/reconciler');

const startScheduler = () => {
  // Default: 2:00 AM IST every night
  // IST = UTC+5:30, so 2:00 AM IST = 8:30 PM UTC = "30 20 * * *"
  const cronExpression = process.env.RECONCILE_CRON || '30 20 * * *';

  cron.schedule(
    cronExpression,
    async () => {
      console.log('⏰ Scheduled reconciliation job started at', new Date().toISOString());
      await runReconciliation('CRON');
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  console.log(`📅 Reconciliation scheduler running — cron: ${cronExpression} (IST)`);
};

module.exports = { startScheduler };