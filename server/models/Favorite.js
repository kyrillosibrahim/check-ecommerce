const mongoose = require('mongoose');

// Single global favorites document (not per-user, matching current behavior)
const favoriteSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  ids: [String],
});

module.exports = mongoose.model('Favorite', favoriteSchema);
