require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Settlement = require('../models/Settlement');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleverbooks';

const couriers = ['shiprocket', 'delhivery', 'bluedart', 'dtdc', 'kwikship'];
const merchants = ['M001', 'M002', 'M003'];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const generateOrders = () => {
  const orders = [];

  // 30 DELIVERED orders
  for (let i = 1; i <= 30; i++) {
    orders.push({
      awbNumber: `AWB${String(i).padStart(6, '0')}`,
      merchantId: randomItem(merchants),
      courierPartner: randomItem(couriers),
      orderStatus: 'DELIVERED',
      codAmount: i % 3 === 0 ? 0 : randomBetween(300, 2000),
      declaredWeight: randomBetween(1, 5),
      orderDate: daysAgo(randomBetween(20, 40)),
      deliveryDate: daysAgo(randomBetween(1, 20)),
    });
  }

  // 10 RTO orders
  for (let i = 31; i <= 40; i++) {
    orders.push({
      awbNumber: `AWB${String(i).padStart(6, '0')}`,
      merchantId: randomItem(merchants),
      courierPartner: randomItem(couriers),
      orderStatus: 'RTO',
      codAmount: 0,
      declaredWeight: randomBetween(1, 5),
      orderDate: daysAgo(randomBetween(20, 40)),
      deliveryDate: null,
    });
  }

  // 10 IN_TRANSIT orders
  for (let i = 41; i <= 50; i++) {
    orders.push({
      awbNumber: `AWB${String(i).padStart(6, '0')}`,
      merchantId: randomItem(merchants),
      courierPartner: randomItem(couriers),
      orderStatus: 'IN_TRANSIT',
      codAmount: randomBetween(300, 2000),
      declaredWeight: randomBetween(1, 5),
      orderDate: daysAgo(randomBetween(5, 15)),
      deliveryDate: null,
    });
  }

  return orders;
};

const generateSettlements = (orders) => {
  const settlements = [];
  const batchId = 'BATCH-SEED-001';

  orders.forEach((order, index) => {
    const base = {
      awbNumber: order.awbNumber,
      batchId,
      merchantId: order.merchantId,
      chargedWeight: order.declaredWeight,
      forwardCharge: randomBetween(40, 120),
      rtoCharge: 0,
      codHandlingFee: order.codAmount > 0 ? order.codAmount * 0.02 : 0,
      settledCodAmount: order.codAmount,
      settlementDate: daysAgo(randomBetween(1, 5)),
      status: 'PENDING_REVIEW',
    };

    // Rule 1: COD Short-remittance — first 5 delivered COD orders
    if (index < 5 && order.codAmount > 0) {
      base.settledCodAmount = order.codAmount - randomBetween(50, 300);
    }

    // Rule 2: Weight Dispute — next 4 orders
    if (index >= 5 && index < 9) {
      base.chargedWeight = order.declaredWeight * randomBetween(12, 16) / 10;
    }

    // Rule 3: Phantom RTO — 3 DELIVERED orders get rtoCharge
    if (index >= 9 && index < 12 && order.orderStatus === 'DELIVERED') {
      base.rtoCharge = randomBetween(60, 150);
    }

    // Rule 4: Overdue Remittance — 5 orders delivered 20+ days ago, no settlementDate
    if (index >= 12 && index < 17 && order.deliveryDate) {
      base.settlementDate = null;
      order.deliveryDate = daysAgo(randomBetween(20, 30));
    }

    settlements.push(base);
  });

  // Rule 5: Duplicate Settlement — re-add AWB000001 in a second batch
  settlements.push({
    awbNumber: 'AWB000001',
    batchId: 'BATCH-SEED-002',
    merchantId: orders[0].merchantId,
    chargedWeight: orders[0].declaredWeight,
    forwardCharge: 80,
    rtoCharge: 0,
    codHandlingFee: 0,
    settledCodAmount: orders[0].codAmount,
    settlementDate: daysAgo(2),
    status: 'PENDING_REVIEW',
  });

  return settlements;
};

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await Order.deleteMany({});
    await Settlement.deleteMany({});
    console.log('🧹 Cleared existing orders and settlements');

    const orders = generateOrders();
    await Order.insertMany(orders);
    console.log(`✅ Inserted ${orders.length} orders`);

    const settlements = generateSettlements(orders);
    await Settlement.insertMany(settlements);
    console.log(`✅ Inserted ${settlements.length} settlements`);

    console.log('\n🎉 Seed complete! Discrepancies planted:');
    console.log('   • 5x COD Short-remittance (AWB000001 – AWB000005)');
    console.log('   • 4x Weight Dispute (AWB000006 – AWB000009)');
    console.log('   • 3x Phantom RTO Charge (AWB000010 – AWB000012)');
    console.log('   • 5x Overdue Remittance (AWB000013 – AWB000017)');
    console.log('   • 1x Duplicate Settlement (AWB000001 in BATCH-SEED-002)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();