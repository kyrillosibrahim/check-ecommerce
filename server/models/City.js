const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  id: Number,
  district_name_en: String,
  district_name_ar: String,
}, { _id: false });

const citySchema = new mongoose.Schema({
  id: Number,
  governorate_id: { type: Number, index: true },
  city_name_en: String,
  city_name_ar: String,
  districts: { type: [districtSchema], default: [] },
});

module.exports = mongoose.model('City', citySchema);
