const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  awbNumber: { type: String, required: true },
  batchId: { type: String, required: true },
  merchantId: { type: String },
  settledCodAmount: { type: Number, default: 0 },
  chargedWeight: { type: Number, required: true },
  forwardCharge: { type: Number, default: 0 },
  rtoCharge: { type: Number, default: 0 },
  codHandlingFee: { type: Number, default: 0 },
  settlementDate: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['MATCHED', 'DISCREPANCY', 'PENDING_REVIEW'], 
    default: 'PENDING_REVIEW' 
  },
  discrepancies: [{ 
    type: { type: String },
    expectedValue: Number,
    actualValue: Number,
    description: String
  }],
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);