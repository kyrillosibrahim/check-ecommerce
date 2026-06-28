const express = require('express');
const {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Financial data — admin only on every operation (read included)
router.get('/', adminAuth, getAllExpenses);
router.post('/', adminAuth, createExpense);
router.put('/:id', adminAuth, updateExpense);
router.delete('/:id', adminAuth, deleteExpense);

module.exports = router;
