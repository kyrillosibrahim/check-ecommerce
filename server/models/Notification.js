const mongoose = require('mongoose');

// A single notification delivered to one user. Broadcast/admin campaigns are
// fanned out into one document per recipient so read-state is tracked per user.
const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['welcome', 'order_created', 'order_shipped', 'coupon', 'general'],
    default: 'general',
  },
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  coupon: {
    code: { type: String, default: '' },
    discountPercentage: { type: Number, default: 0 },
    expiresAt: { type: String, default: '' },
  },
  read: { type: Boolean, default: false },
  createdAt: { type: String },
});

module.exports = mongoose.model('Notification', notificationSchema);
