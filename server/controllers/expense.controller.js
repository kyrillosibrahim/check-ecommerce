const path = require('path');
const fse = require('fs-extra');

const DATA_FILE = path.join(__dirname, '..', 'data', 'expenses.json');

async function readExpenses() {
  if (!(await fse.pathExists(DATA_FILE))) {
    await fse.writeJson(DATA_FILE, [], { spaces: 2 });
    return [];
  }
  return fse.readJson(DATA_FILE);
}

async function writeExpenses(expenses) {
  await fse.writeJson(DATA_FILE, expenses, { spaces: 2 });
}

function getNextId(expenses) {
  if (expenses.length === 0) return 1;
  return Math.max(...expenses.map(e => e.id)) + 1;
}

// GET /api/expenses
async function getAllExpenses(_req, res, next) {
  try {
    const expenses = await readExpenses();
    res.json(expenses);
  } catch (err) {
    next(err);
  }
}

// POST /api/expenses
async function createExpense(req, res, next) {
  try {
    const { title, category, amount, month, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Expense title is required.' });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid amount is required.' });
    }

    const expenses = await readExpenses();

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newExpense = {
      id: getNextId(expenses),
      title: title.trim(),
      category: (category || 'أخرى').trim(),
      amount: Number(amount),
      month: (month || defaultMonth).trim(),
      notes: (notes || '').trim(),
      createdAt: now.toISOString(),
    };

    expenses.push(newExpense);
    await writeExpenses(expenses);

    res.status(201).json(newExpense);
  } catch (err) {
    next(err);
  }
}

// PUT /api/expenses/:id
async function updateExpense(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, category, amount, month, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Expense title is required.' });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid amount is required.' });
    }

    const expenses = await readExpenses();
    const index = expenses.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    expenses[index].title = title.trim();
    expenses[index].category = (category || 'أخرى').trim();
    expenses[index].amount = Number(amount);
    expenses[index].month = (month || expenses[index].month).trim();
    expenses[index].notes = (notes || '').trim();

    await writeExpenses(expenses);
    res.json(expenses[index]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const expenses = await readExpenses();
    const index = expenses.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    expenses.splice(index, 1);
    await writeExpenses(expenses);

    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllExpenses, createExpense, updateExpense, deleteExpense };
