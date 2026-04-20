const mongoose = require('mongoose');

const governorateSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  governorate_name_en: String,
  governorate_name_ar: String,
  shippingCost: { type: Number, default: 0 },
  extraShippingCost: { type: Number, default: 0 },
});

module.exports = mongoose.model('Governorate', governorateSchema);
