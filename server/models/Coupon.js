const mongoose = require('mongoose');

// A discount code that applies a percentage off the invoice. Created/refreshed
// whenever an admin sends a coupon notification.
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercentage: { type: Number, required: true },
  expiresAt: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: String },
});

module.exports = mongoose.model('Coupon', couponSchema);
