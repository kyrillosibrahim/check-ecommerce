const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  id: Number,
  governorate_id: { type: Number, index: true },
  city_name_en: String,
  city_name_ar: String,
});

module.exports = mongoose.model('City', citySchema);
