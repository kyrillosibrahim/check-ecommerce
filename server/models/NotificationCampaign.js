const mongoose = require('mongoose');

// A record of an admin-sent notification campaign (the message + audience),
// used by the dashboard's "sent notifications" log.
const campaignSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, default: 'general' },
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  coupon: {
    code: { type: String, default: '' },
    discountPercentage: { type: Number, default: 0 },
    expiresAt: { type: String, default: '' },
  },
  // Human-readable description of who received it (e.g. "كل العملاء" or "حالة الطلب: تم الشحن").
  audience: { type: String, default: '' },
  recipientsCount: { type: Number, default: 0 },
  createdAt: { type: String },
});

module.exports = mongoose.model('NotificationCampaign', campaignSchema);
