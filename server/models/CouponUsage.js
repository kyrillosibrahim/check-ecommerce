const mongoose = require('mongoose');

// Records that a coupon was consumed — once per account AND once per browser,
// so the same code cannot be reused by creating a second email on one device.
const couponUsageSchema = new mongoose.Schema({
  code: { type: String, required: true, index: true, uppercase: true, trim: true },
  userId: { type: String, default: '' },
  browserId: { type: String, default: '' },
  usedAt: { type: String },
});

// Atomic one-use guards: a duplicate insert (concurrent double-spend) violates
// these and is rejected at the DB level. Partial filters skip empty ids so an
// anonymous usage (userId:'') doesn't collide with other anonymous usages.
couponUsageSchema.index({ code: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $gt: '' } } });
couponUsageSchema.index({ code: 1, browserId: 1 }, { unique: true, partialFilterExpression: { browserId: { $gt: '' } } });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
