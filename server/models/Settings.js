const mongoose = require('mongoose');

// Singleton document - always one settings document with _id='global'
const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  logo:     { type: String, default: '' },
  logoAr:   { type: String, default: '' },
  logoEn:   { type: String, default: '' },
  logoIcon: { type: String, default: '' },
  colors: {
    primaryLight: { type: String, default: '#4a90d9' },
    primaryDark: { type: String, default: '#4dabf7' },
    secondaryLight: { type: String, default: '#1bbc9b' },
    secondaryDark: { type: String, default: '#20c9a6' },
  },
  social: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  bestSellingProducts: [String],
  bestSellingBrands: [Number],
  naturalProducts: [{
    _id: false,
    video: { type: String, default: '' },
    link: { type: String, default: '' },
  }],
});

module.exports = mongoose.model('Settings', settingsSchema);
