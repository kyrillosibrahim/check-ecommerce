const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

function generateId() {
  return 'rev-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function clean(review) {
  const obj = review.toObject ? review.toObject() : { ...review };
  delete obj._id;
  delete obj.__v;
  return obj;
}

/** Recalculate a product's average rating and count from its approved reviews. */
async function recomputeProductRating(productId) {
  const approved = await Review.find({ productId, status: 'approved' });
  const count = approved.length;
  const avg = count ? approved.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;
  await Product.updateOne(
    { id: productId },
    { $set: { rating: Math.round(avg * 10) / 10, ratingsCount: count } }
  );
}

// POST /api/reviews  (auth)
async function createReview(req, res, next) {
  try {
    const { productId, rating, comment } = req.body;
    const stars = Number(rating);
    if (!productId || !stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'المنتج وعدد النجوم (1 إلى 5) مطلوبان' });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (user.reviewsDisabled) {
      return res.status(403).json({ error: 'تم تعطيل إمكانية التقييم لحسابك' });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

    const now = new Date().toISOString();
    const existing = await Review.findOne({ productId, userId: user.id });

    let saved;
    if (existing) {
      existing.rating = stars;
      existing.comment = (comment || '').trim();
      existing.status = 'pending';
      existing.userName = user.name;
      existing.userPhone = user.phone;
      existing.updatedAt = now;
      saved = await existing.save();
    } else {
      saved = await Review.create({
        id: generateId(),
        productId,
        productTitle: product.title,
        productSlug: product.slug,
        productCategory: product.category,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        rating: stars,
        comment: (comment || '').trim(),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    }

    return res.status(201).json({ message: 'تم إرسال التقييم وسيتم مراجعته للنشر', review: clean(saved) });
  } catch (err) { next(err); }
}

// GET /api/reviews/product/:productId  (public — approved only)
async function getProductReviews(req, res, next) {
  try {
    const reviews = await Review.find({ productId: req.params.productId, status: 'approved' })
      .sort({ updatedAt: -1 });
    return res.json(reviews.map(clean));
  } catch (err) { next(err); }
}

// GET /api/reviews/mine/:productId  (auth)
async function getMyReview(req, res, next) {
  try {
    const review = await Review.findOne({ productId: req.params.productId, userId: req.user.id });
    return res.json(review ? clean(review) : null);
  } catch (err) { next(err); }
}

// GET /api/reviews  (dashboard — all, optional ?status=)
async function getAllReviews(req, res, next) {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const reviews = await Review.find(query).sort({ updatedAt: -1 });
    return res.json(reviews.map(clean));
  } catch (err) { next(err); }
}

// PUT /api/reviews/:id/approve  (dashboard)
async function approveReview(req, res, next) {
  try {
    const review = await Review.findOne({ id: req.params.id });
    if (!review) return res.status(404).json({ error: 'التقييم غير موجود' });
    review.status = 'approved';
    review.updatedAt = new Date().toISOString();
    await review.save();
    await recomputeProductRating(review.productId);
    return res.json({ message: 'تمت الموافقة على التقييم', review: clean(review) });
  } catch (err) { next(err); }
}

// DELETE /api/reviews/:id  (dashboard)
async function deleteReview(req, res, next) {
  try {
    const review = await Review.findOne({ id: req.params.id });
    if (!review) return res.status(404).json({ error: 'التقييم غير موجود' });
    await Review.deleteOne({ id: req.params.id });
    await recomputeProductRating(review.productId);
    return res.json({ message: 'تم حذف التقييم' });
  } catch (err) { next(err); }
}

// PUT /api/reviews/disable-user/:userId  (dashboard)
async function disableUserReviews(req, res, next) {
  try {
    const result = await User.updateOne({ id: req.params.userId }, { $set: { reviewsDisabled: true } });
    if (!result.matchedCount) return res.status(404).json({ error: 'المستخدم غير موجود' });
    return res.json({ message: 'تم تعطيل التقييم لهذا المستخدم' });
  } catch (err) { next(err); }
}

// PUT /api/reviews/enable-user/:userId  (dashboard)
async function enableUserReviews(req, res, next) {
  try {
    const result = await User.updateOne({ id: req.params.userId }, { $set: { reviewsDisabled: false } });
    if (!result.matchedCount) return res.status(404).json({ error: 'المستخدم غير موجود' });
    return res.json({ message: 'تم تفعيل التقييم لهذا المستخدم' });
  } catch (err) { next(err); }
}

module.exports = {
  createReview,
  getProductReviews,
  getMyReview,
  getAllReviews,
  approveReview,
  deleteReview,
  disableUserReviews,
  enableUserReviews,
};
