const mongoose = require('mongoose');

// Records that a coupon was consumed — once per account AND once per browser,
// so the same code cannot be reused by creating a second email on one device.
const couponUsageSchema = new mongoose.Schema({
  code: { type: String, required: true, index: true, uppercase: true, trim: true },
  userId: { type: String, default: '' },
  browserId: { type: String, default: '' },
  usedAt: { type: String },
});

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
