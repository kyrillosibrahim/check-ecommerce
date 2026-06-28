const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: String,
  categoryFolder: String,
  title: String,
  titleAr: String,
  description: String,
  descriptionAr: String,
  descriptionHtml: String,
  descriptionHtmlAr: String,
  category: String,
  categoryId: Number,
  subcategory: String,
  brand: String,
  merchant: String,
  wholesalePrice: Number,
  originalPrice: Number,
  discountedPrice: Number,
  discountPercentage: Number,
  merchantProfitPercentage: Number,
  price: Number,
  stock: Number,
  rating: Number,
  ratingsCount: Number,
  isFeatured: Boolean,
  comingSoon: Boolean,
  isWholesaleOffer: { type: Boolean, default: false },
  tags: [String],
  filterTags: [String],
  productForm: mongoose.Schema.Types.Mixed,
  faq: [mongoose.Schema.Types.Mixed],
  offers: [mongoose.Schema.Types.Mixed],
  mainImages: [String],
  swiperImages: [String],
  normalImages: [String],
  createdAt: String,
}, { strict: false });

// Indexes for the hot query paths in getAllProducts (listing/filter/sort) and
// getProduct/getProductById. Without these every listing was a full collection scan.
productSchema.index({ categoryFolder: 1, createdAt: -1 });
productSchema.index({ category: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isWholesaleOffer: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });
// Weighted text index for the search box (title/brand/tags).
productSchema.index({ title: 'text', titleAr: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
