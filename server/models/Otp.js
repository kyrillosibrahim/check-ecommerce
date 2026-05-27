const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: String,
  expiresAt: String,
});

module.exports = mongoose.model('Otp', otpSchema);
