const mongoose = require('mongoose');

// A discount code that applies a percentage off the invoice. Created/refreshed
// whenever an admin sends a coupon notification.
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercentage: { type: Number, required: true },
  // Changes on every send, so re-sending the same code opens a fresh round of
  // one-time uses instead of staying blocked for everyone who used it before.
  issueId: { type: String, default: '' },
  expiresAt: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: String },
});

module.exports = mongoose.model('Coupon', couponSchema);
