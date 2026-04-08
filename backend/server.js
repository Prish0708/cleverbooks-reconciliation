require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const settlementRoutes = require('./routes/settlements');
const orderRoutes = require('./routes/orders');
const jobRoutes = require('./routes/jobs');
const notificationRoutes = require('./routes/notifications');
const { startScheduler } = require('./jobs/scheduler');
const { startWorker } = require('./services/notificationWorker');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting on upload endpoint — max 5 requests per minute
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many upload requests, please wait a minute' },
});

// Routes
app.use('/api/settlements/upload', uploadLimiter);
app.use('/api/settlements', settlementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Start cron scheduler
    startScheduler();

    // Start BullMQ notification worker
    startWorker();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });