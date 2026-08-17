const express = require('express');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth.middleware');
const {
  getAllOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/order.controller');

const router = express.Router();

// Customer endpoints
router.get('/mine', auth, getMyOrders);
router.post('/', optionalAuth, createOrder);

// Admin endpoints (dashboard sends x-admin-key)
router.get('/', adminAuth, getAllOrders);
router.get('/:id', adminAuth, getOrderById);
router.put('/:id', adminAuth, updateOrder);
router.delete('/:id', adminAuth, deleteOrder);

module.exports = router;
