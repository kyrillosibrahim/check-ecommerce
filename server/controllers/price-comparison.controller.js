const path = require('path');
const fse = require('fs-extra');

const DATA_FILE = path.join(__dirname, '..', 'data', 'price-comparisons.json');

async function readComparisons() {
  if (!(await fse.pathExists(DATA_FILE))) {
    await fse.writeJson(DATA_FILE, [], { spaces: 2 });
    return [];
  }
  return fse.readJson(DATA_FILE);
}

async function writeComparisons(comparisons) {
  await fse.writeJson(DATA_FILE, comparisons, { spaces: 2 });
}

function getNextId(comparisons) {
  if (comparisons.length === 0) return 1;
  return Math.max(...comparisons.map(c => c.id)) + 1;
}

function calcBest(merchants, sellingPrice) {
  if (!merchants || merchants.length === 0) {
    return { bestMerchant: '', bestWholesalePrice: 0, profit: 0, profitPercent: 0 };
  }
  const best = merchants.reduce((a, b) => a.wholesalePrice <= b.wholesalePrice ? a : b);
  const profit = sellingPrice - best.wholesalePrice;
  const profitPercent = best.wholesalePrice > 0
    ? Math.round((profit / best.wholesalePrice) * 100 * 100) / 100
    : 0;
  return {
    bestMerchant: best.merchantName,
    bestWholesalePrice: best.wholesalePrice,
    profit,
    profitPercent,
  };
}

// GET /api/price-comparisons
async function getAll(_req, res, next) {
  try {
    const comparisons = await readComparisons();
    res.json(comparisons);
  } catch (err) {
    next(err);
  }
}

// POST /api/price-comparisons
async function create(req, res, next) {
  try {
    const { productId, productName, categorySlug, merchants, sellingPrice } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({ error: 'Product info is required.' });
    }
    if (!merchants || merchants.length === 0) {
      return res.status(400).json({ error: 'At least one merchant is required.' });
    }

    const comparisons = await readComparisons();

    const existing = comparisons.find(c => c.productId === productId);
    if (existing) {
      return res.status(409).json({ error: 'Comparison for this product already exists.' });
    }

    const best = calcBest(merchants, sellingPrice || 0);

    const newEntry = {
      id: getNextId(comparisons),
      productId,
      productName,
      categorySlug: categorySlug || '',
      merchants,
      sellingPrice: sellingPrice || 0,
      ...best,
      createdAt: new Date().toISOString(),
    };

    comparisons.push(newEntry);
    await writeComparisons(comparisons);

    res.status(201).json(newEntry);
  } catch (err) {
    next(err);
  }
}

// PUT /api/price-comparisons/:id
async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { merchants, sellingPrice, productName, categorySlug } = req.body;

    const comparisons = await readComparisons();
    const index = comparisons.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Comparison not found.' });
    }

    if (merchants) comparisons[index].merchants = merchants;
    if (sellingPrice !== undefined) comparisons[index].sellingPrice = sellingPrice;
    if (productName) comparisons[index].productName = productName;
    if (categorySlug) comparisons[index].categorySlug = categorySlug;

    const best = calcBest(
      comparisons[index].merchants,
      comparisons[index].sellingPrice
    );
    Object.assign(comparisons[index], best);

    await writeComparisons(comparisons);
    res.json(comparisons[index]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/price-comparisons/:id
async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const comparisons = await readComparisons();
    const index = comparisons.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Comparison not found.' });
    }

    comparisons.splice(index, 1);
    await writeComparisons(comparisons);

    res.json({ message: 'Comparison deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
