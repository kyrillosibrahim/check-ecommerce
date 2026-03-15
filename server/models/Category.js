const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  id: Number,
  name: String,
  slug: String,
  image: String,
}, { _id: false });

const categorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: '' },
  subcategories: [subcategorySchema],
  famousBrands: [Number],
  filterTags: [String],
});

module.exports = mongoose.model('Category', categorySchema);
