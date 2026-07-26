const mongoose = require('mongoose');

const customerActivitySchema = new mongoose.Schema(
  {
    deviceId:        { type: String, required: true },
    deviceName:      { type: String, default: '' },
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName:        { type: String, default: '' },
    userPhone:       { type: String, default: '' },
    path:            { type: String, required: true },
    title:           { type: String, default: '' },
    enteredAt:       { type: Date, required: true },
    durationSeconds: { type: Number, default: 0, min: 0 },
    date:            { type: String, required: true }, // YYYY-MM-DD, mirrors SiteVisit.date
    ipAddress:       { type: String, default: '' },
    userAgent:       { type: String, default: '' },
  },
  { timestamps: true }
);

const TTL_DAYS = parseInt(process.env.CUSTOMER_ACTIVITY_TTL_DAYS, 10) || 90;

// One document per navigation per visitor grows quickly, so 90 days caps retention by default.
customerActivitySchema.index({ enteredAt: 1 }, { expireAfterSeconds: TTL_DAYS * 86400 });
customerActivitySchema.index({ date: 1, enteredAt: -1 });
customerActivitySchema.index({ deviceId: 1, enteredAt: -1 });
customerActivitySchema.index({ userPhone: 1, enteredAt: -1 });

module.exports = mongoose.model('CustomerActivity', customerActivitySchema);
