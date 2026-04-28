const mongoose = require('mongoose');

const wholesaleOfferSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: String,
  title: String,
  titleAr: String,
  description: String,
  descriptionAr: String,
  descriptionHtml: String,
  descriptionHtmlAr: String,
  wholesalePrice: Number,
  originalPrice: Number,
  discountedPrice: Number,
  discountPercentage: Number,
  merchantProfitPercentage: Number,
  faq: [mongoose.Schema.Types.Mixed],
  offers: [mongoose.Schema.Types.Mixed],
  mainImages: [String],
  swiperImages: [String],
  normalImages: [String],
  metaTitle: String,
  metaDescription: String,
  seoKeywords: [String],
  createdAt: String,
}, { strict: false });

module.exports = mongoose.model('WholesaleOffer', wholesaleOfferSchema);
