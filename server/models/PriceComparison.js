const mongoose = require('mongoose');

const priceComparisonSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  productId: { type: String, required: true, unique: true },
  productName: String,
  categorySlug: String,
  merchants: [mongoose.Schema.Types.Mixed],
  sellingPrice: { type: Number, default: 0 },
  bestMerchant: String,
  bestWholesalePrice: Number,
  profit: Number,
  profitPercent: Number,
  createdAt: String,
});

module.exports = mongoose.model('PriceComparison', priceComparisonSchema);
