const mongoose = require('mongoose');

// Per-user cart document, keyed by the owner's user id.
const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  items: [
    {
      productId: String,
      quantity: Number,
      _id: false,
    },
  ],
});

module.exports = mongoose.model('Cart', cartSchema);
