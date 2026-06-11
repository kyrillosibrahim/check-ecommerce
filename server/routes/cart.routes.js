const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cart.controller');

const router = express.Router();

// The cart is private to the logged-in user.
router.use(auth);

router.get('/getcart', getCart);
router.post('/addtocart', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
