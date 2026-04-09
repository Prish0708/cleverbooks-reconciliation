const express = require('express');
const router = express.Router();
const multer = require('multer');
const papa = require('papaparse');
const { randomUUID } = require('crypto');
const Settlement = require('../models/Settlement');
const Order = require('../models/Order');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/settlements/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const batchId = req.body.batchId || randomUUID();

    // Idempotency check
    const existing = await Settlement.findOne({ batchId });
    if (existing) {
      return res.status(409).json({ message: 'Batch already processed', batchId });
    }

    let records = [];

    if (req.file) {
      const content = req.file.buffer.toString('utf8');
      const ext = req.file.originalname.split('.').pop().toLowerCase();

      if (ext === 'csv') {
        const parsed = papa.parse(content, { header: true, skipEmptyLines: true });
        records = parsed.data;
      } else if (ext === 'json') {
        records = JSON.parse(content);
      } else {
        return res.status(400).json({ message: 'Only CSV or JSON files allowed' });
      }
    } else {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (records.length > 1000) {
      return res.status(400).json({ message: 'Max 1000 records per batch' });
    }

    const settlements = records.map(r => ({
      awbNumber: r.awbNumber,
      batchId,
      merchantId: r.merchantId || 'UNKNOWN',
      settledCodAmount: parseFloat(r.settledCodAmount) || 0,
      chargedWeight: parseFloat(r.chargedWeight) || 0,
      forwardCharge: parseFloat(r.forwardCharge) || 0,
      rtoCharge: parseFloat(r.rtoCharge) || 0,
      codHandlingFee: parseFloat(r.codHandlingFee) || 0,
      settlementDate: r.settlementDate ? new Date(r.settlementDate) : null,
      status: 'PENDING_REVIEW',
    }));

    await Settlement.insertMany(settlements);

    res.status(201).json({ 
      message: 'Batch uploaded successfully', 
      batchId, 
      count: settlements.length 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// GET /api/settlements?status=
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.merchantId) filter.merchantId = req.query.merchantId;

    const settlements = await Settlement.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settlements', error: err.message });
  }
});

// GET /api/settlements/:id
router.get('/:id', async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) return res.status(404).json({ message: 'Not found' });

    const order = await Order.findOne({ awbNumber: settlement.awbNumber });
    res.json({ settlement, order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settlement', error: err.message });
  }
});

module.exports = router;