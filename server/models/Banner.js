const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  image: { type: String, required: true },
  link: { type: String, default: '' },
  page: { type: String, default: 'home' },
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model('Banner', bannerSchema);
