const mongoose = require('mongoose');

// Per-user favorites document, keyed by the owner's user id.
const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  ids: [String],
});

module.exports = mongoose.model('Favorite', favoriteSchema);
