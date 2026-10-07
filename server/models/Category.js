const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  id: Number,
  name: String,
  nameEn: { type: String, default: '' }, // shown when the storefront is in English
  slug: String,
  image: String,
}, { _id: false });

const categorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  nameEn: { type: String, default: '' }, // shown when the storefront is in English
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: '' },
  subcategories: [subcategorySchema],
  famousBrands: [Number],
  filterTags: [String],
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model('Category', categorySchema);
