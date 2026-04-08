const Settlement = require('../models/Settlement');
const Order = require('../models/Order');
const Job = require('../models/Job');
const { publishDiscrepancyEvent } = require('./queue');

const detectDiscrepancies = (order, settlement) => {
  const discrepancies = [];

  // Rule 1: COD Short-remittance
  if (order.codAmount > 0) {
    const tolerance = Math.min(order.codAmount * 0.02, 10);
    if (settlement.settledCodAmount < order.codAmount - tolerance) {
      discrepancies.push({
        type: 'COD_SHORT_REMITTANCE',
        expectedValue: order.codAmount,
        actualValue: settlement.settledCodAmount,
        description: `Merchant should have received ₹${order.codAmount} but got ₹${settlement.settledCodAmount}`,
      });
    }
  }

  // Rule 2: Weight Dispute
  if (settlement.chargedWeight > order.declaredWeight * 1.10) {
    discrepancies.push({
      type: 'WEIGHT_DISPUTE',
      expectedValue: order.declaredWeight,
      actualValue: settlement.chargedWeight,
      description: `Courier charged ${settlement.chargedWeight}kg but declared weight was ${order.declaredWeight}kg`,
    });
  }

  // Rule 3: Phantom RTO Charge
  if (settlement.rtoCharge > 0 && order.orderStatus === 'DELIVERED') {
    discrepancies.push({
      type: 'PHANTOM_RTO_CHARGE',
      expectedValue: 0,
      actualValue: settlement.rtoCharge,
      description: `RTO charge of ₹${settlement.rtoCharge} applied but order was DELIVERED`,
    });
  }

  // Rule 4: Overdue Remittance
  if (order.deliveryDate && !settlement.settlementDate) {
    const daysSinceDelivery = Math.floor(
      (Date.now() - new Date(order.deliveryDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceDelivery > 14) {
      discrepancies.push({
        type: 'OVERDUE_REMITTANCE',
        expectedValue: 14,
        actualValue: daysSinceDelivery,
        description: `Order delivered ${daysSinceDelivery} days ago but no settlement received yet`,
      });
    }
  }

  // Rule 5: Duplicate Settlement
  // (handled separately below via aggregation)

  return discrepancies;
};

const runReconciliation = async (triggeredBy = 'CRON') => {
  const job = await Job.create({ triggeredBy, status: 'RUNNING' });

  try {
    let recordsProcessed = 0;
    let discrepanciesFound = 0;
    let matchedCount = 0;
    let pendingCount = 0;

    // Find duplicate AWBs across batches
    const duplicates = await Settlement.aggregate([
      { $group: { _id: '$awbNumber', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    const duplicateAwbs = new Set(duplicates.map(d => d._id));

    // Get all PENDING_REVIEW settlements
    const settlements = await Settlement.find({ status: 'PENDING_REVIEW' });

    for (const settlement of settlements) {
      recordsProcessed++;

      const order = await Order.findOne({ awbNumber: settlement.awbNumber });

      if (!order) {
        settlement.status = 'PENDING_REVIEW';
        await settlement.save();
        pendingCount++;
        continue;
      }

      const discrepancies = detectDiscrepancies(order, settlement);

      // Check duplicate
      if (duplicateAwbs.has(settlement.awbNumber)) {
        discrepancies.push({
          type: 'DUPLICATE_SETTLEMENT',
          expectedValue: 1,
          actualValue: 2,
          description: `AWB ${settlement.awbNumber} appears in multiple settlement batches`,
        });
      }

      if (discrepancies.length > 0) {
        settlement.status = 'DISCREPANCY';
        settlement.discrepancies = discrepancies;
        settlement.merchantId = order.merchantId;
        await settlement.save();
        discrepanciesFound++;

        // Publish each discrepancy to queue
        for (const d of discrepancies) {
          await publishDiscrepancyEvent({
            merchantId: order.merchantId,
            awbNumber: settlement.awbNumber,
            discrepancyType: d.type,
            expectedValue: d.expectedValue,
            actualValue: d.actualValue,
            suggestedAction: getSuggestedAction(d.type),
            settlementId: settlement._id.toString(),
          });
        }
      } else {
        settlement.status = 'MATCHED';
        settlement.merchantId = order.merchantId;
        await settlement.save();
        matchedCount++;
      }
    }

    await Job.findByIdAndUpdate(job._id, {
      status: 'COMPLETED',
      recordsProcessed,
      discrepanciesFound,
      matchedCount,
      pendingCount,
    });

    console.log(`✅ Reconciliation done — ${recordsProcessed} processed, ${discrepanciesFound} discrepancies`);

  } catch (err) {
    console.error('❌ Reconciliation failed:', err);
    await Job.findByIdAndUpdate(job._id, { status: 'FAILED', error: err.message });
  }
};

const getSuggestedAction = (type) => {
  const actions = {
    COD_SHORT_REMITTANCE: 'Raise a remittance dispute with the courier for the shortfall amount.',
    WEIGHT_DISPUTE: 'Submit proof of actual weight with courier dispute portal.',
    PHANTOM_RTO_CHARGE: 'Request reversal of RTO charge — order was successfully delivered.',
    OVERDUE_REMITTANCE: 'Contact courier to initiate overdue remittance immediately.',
    DUPLICATE_SETTLEMENT: 'Flag this AWB for manual review — duplicate settlement batch detected.',
  };
  return actions[type] || 'Review this record manually.';
};

module.exports = { runReconciliation };