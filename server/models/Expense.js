const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'أخرى' },
  amount: { type: Number, required: true },
  month: String,
  notes: { type: String, default: '' },
  createdAt: String,
});

module.exports = mongoose.model('Expense', expenseSchema);
