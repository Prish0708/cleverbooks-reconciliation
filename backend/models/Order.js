const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  awbNumber: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true },
  courierPartner: { type: String, required: true },
  orderStatus: { 
    type: String, 
    enum: ['DELIVERED', 'RTO', 'IN_TRANSIT', 'LOST'], 
    required: true 
  },
  codAmount: { type: Number, default: 0 },
  declaredWeight: { type: Number, required: true },
  orderDate: { type: Date, required: true },
  deliveryDate: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);