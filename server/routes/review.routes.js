const express = require('express');
const auth = require('../middleware/auth.middleware');
const { optionalAuth, adminAuth } = require('../middleware/auth.middleware');
const {
  createReview,
  getProductReviews,
  markHelpful,
  getMyReview,
  getAllReviews,
  approveReview,
  deleteReview,
  disableUserReviews,
  enableUserReviews,
} = require('../controllers/review.controller');

const router = express.Router();

// Storefront (user)
router.post('/', auth, createReview);
router.get('/product/:productId', optionalAuth, getProductReviews);
router.put('/:id/helpful', auth, markHelpful);
router.get('/mine/:productId', auth, getMyReview);

// Dashboard (admin) — getAllReviews leaks customer phones, so gate the whole group
router.get('/', adminAuth, getAllReviews);
router.put('/:id/approve', adminAuth, approveReview);
router.delete('/:id', adminAuth, deleteReview);
router.put('/disable-user/:userId', adminAuth, disableUserReviews);
router.put('/enable-user/:userId', adminAuth, enableUserReviews);

module.exports = router;
