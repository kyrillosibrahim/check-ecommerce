const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema(
  {
    deviceId:   { type: String, required: true, index: true },
    deviceName: { type: String, required: true },
    userAgent:  { type: String, default: '' },
    ipAddress:  { type: String, default: '' },
    date:       { type: String, required: true, index: true }, // YYYY-MM-DD
    visitCount: { type: Number, default: 1 },
    lastVisitAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

siteVisitSchema.index({ deviceId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SiteVisit', siteVisitSchema);
