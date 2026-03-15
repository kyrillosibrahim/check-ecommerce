const mongoose = require('mongoose');

// Single global cart document (not per-user, matching current behavior)
const cartSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  items: [
    {
      productId: String,
      quantity: Number,
      _id: false,
    },
  ],
});

module.exports = mongoose.model('Cart', cartSchema);
