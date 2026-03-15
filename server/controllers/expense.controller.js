const Expense = require('../models/Expense');

async function getNextId() { const last = await Expense.findOne({}, { id: 1 }).sort({ id: -1 }); return last ? last.id + 1 : 1; }

async function getAllExpenses(_req, res, next) {
  try { const expenses = await Expense.find({}, { __v: 0 }); res.json(expenses.map(e => { const o = e.toObject(); delete o._id; return o; })); }
  catch (err) { next(err); }
}

async function createExpense(req, res, next) {
  try {
    const { title, category, amount, month, notes } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Expense title is required.' });
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'A valid amount is required.' });
    const now = new Date();
    const defaultMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const exp = await Expense.create({ id: await getNextId(), title: title.trim(), category: (category || 'أخرى').trim(), amount: Number(amount), month: (month || defaultMonth).trim(), notes: (notes || '').trim(), createdAt: now.toISOString() });
    const o = exp.toObject(); delete o._id; delete o.__v; res.status(201).json(o);
  } catch (err) { next(err); }
}

async function updateExpense(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10); const { title, category, amount, month, notes } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Expense title is required.' });
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'A valid amount is required.' });
    const exp = await Expense.findOneAndUpdate({ id }, { title: title.trim(), category: (category || 'أخرى').trim(), amount: Number(amount), month: (month || '').trim(), notes: (notes || '').trim() }, { new: true, projection: { __v: 0 } });
    if (!exp) return res.status(404).json({ error: 'Expense not found.' });
    const o = exp.toObject(); delete o._id; res.json(o);
  } catch (err) { next(err); }
}

async function deleteExpense(req, res, next) {
  try { const result = await Expense.findOneAndDelete({ id: parseInt(req.params.id, 10) }); if (!result) return res.status(404).json({ error: 'Expense not found.' }); res.json({ message: 'Expense deleted successfully.' }); }
  catch (err) { next(err); }
}

module.exports = { getAllExpenses, createExpense, updateExpense, deleteExpense };
