const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productTitle: String,
  productSlug: String,
  productCategory: String,
  userId: { type: String, required: true },
  userName: String,
  userPhone: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  status: { type: String, default: 'pending' }, // 'pending' | 'approved'
  createdAt: { type: String },
  updatedAt: { type: String },
});

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
