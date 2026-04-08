const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  merchantId: { type: String, required: true },
  awbNumber: { type: String, required: true },
  discrepancyType: { type: String, required: true },
  expectedValue: { type: Number },
  actualValue: { type: Number },
  suggestedAction: { type: String },
  status: { 
    type: String, 
    enum: ['SENT', 'FAILED', 'RETRYING'], 
    default: 'RETRYING' 
  },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date, default: null },
  jobId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);