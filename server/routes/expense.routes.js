const express = require('express');
const {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');

const router = express.Router();

router.get('/', getAllExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
