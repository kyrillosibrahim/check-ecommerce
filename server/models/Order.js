const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true, default: '' },
  customer: mongoose.Schema.Types.Mixed,
  items: [mongoose.Schema.Types.Mixed],
  shippingAddress: mongoose.Schema.Types.Mixed,
  shippingCost: { type: Number, default: 0 },
  shippingCompany: { type: String, default: '' },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  couponDiscount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'unpaid' },
  paymentMethod: { type: String, default: 'cod' },
  notes: { type: String, default: '' },
  date: { type: String },
  storeProfitTotal: { type: Number, default: 0 },
  systemCommission: { type: Number, default: 5 },
});

module.exports = mongoose.model('Order', orderSchema);
