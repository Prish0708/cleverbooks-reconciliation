const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  runAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['RUNNING', 'COMPLETED', 'FAILED'], 
    default: 'RUNNING' 
  },
  recordsProcessed: { type: Number, default: 0 },
  discrepanciesFound: { type: Number, default: 0 },
  matchedCount: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  error: { type: String, default: null },
  triggeredBy: { type: String, enum: ['CRON', 'MANUAL'], default: 'CRON' },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);