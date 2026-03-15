const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: '' },
  link: { type: String, default: '' },
});

module.exports = mongoose.model('Brand', brandSchema);
