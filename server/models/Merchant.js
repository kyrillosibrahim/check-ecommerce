const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: String,
});

module.exports = mongoose.model('Merchant', merchantSchema);
