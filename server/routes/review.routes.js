const express = require('express');
const auth = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');
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

// Dashboard (admin)
router.get('/', getAllReviews);
router.put('/:id/approve', approveReview);
router.delete('/:id', deleteReview);
router.put('/disable-user/:userId', disableUserReviews);
router.put('/enable-user/:userId', enableUserReviews);

module.exports = router;
