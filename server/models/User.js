const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  governorate: String,
  city: String,
  address: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  addresses: [addressSchema],
  reviewsDisabled: { type: Boolean, default: false },
  createdAt: { type: String },
});

module.exports = mongoose.model('User', userSchema);
