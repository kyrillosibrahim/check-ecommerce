const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth.middleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
} = require('../controllers/cart.controller');

const router = express.Router();

// The cart is keyed per user or per browser.
router.use(optionalAuth);

router.get('/getcart', getCart);
router.post('/merge', auth, mergeGuestCart);
router.post('/addtocart', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
