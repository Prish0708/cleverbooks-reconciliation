const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { runReconciliation } = require('../services/reconciler');

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(10);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message });
  }
});

// POST /api/jobs/trigger — manual trigger for demo
router.post('/trigger', async (req, res) => {
  try {
    res.json({ message: 'Reconciliation job triggered' });
    await runReconciliation('MANUAL');
  } catch (err) {
    res.status(500).json({ message: 'Failed to trigger job', error: err.message });
  }
});

module.exports = router;