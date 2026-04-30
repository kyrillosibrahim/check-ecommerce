const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true },
    path: { type: String, required: true },
    title: { type: String, default: '' },
    enteredAt: { type: Date, required: true, index: true },
    durationSeconds: { type: Number, default: 0 },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
