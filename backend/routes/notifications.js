const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
});

module.exports = router;