const PriceComparison = require('../models/PriceComparison');

async function getNextId() { const last = await PriceComparison.findOne({}, { id: 1 }).sort({ id: -1 }); return last ? last.id + 1 : 1; }

function calcBest(merchants, sellingPrice) {
  if (!merchants || merchants.length === 0) return { bestMerchant: '', bestWholesalePrice: 0, profit: 0, profitPercent: 0 };
  const best = merchants.reduce((a, b) => a.wholesalePrice <= b.wholesalePrice ? a : b);
  const profit = sellingPrice - best.wholesalePrice;
  return { bestMerchant: best.merchantName, bestWholesalePrice: best.wholesalePrice, profit, profitPercent: best.wholesalePrice > 0 ? Math.round((profit / best.wholesalePrice) * 100 * 100) / 100 : 0 };
}

async function getAll(_req, res, next) {
  try { const items = await PriceComparison.find({}, { __v: 0 }); res.json(items.map(i => { const o = i.toObject(); delete o._id; return o; })); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { productId, productName, categorySlug, merchants, sellingPrice } = req.body;
    if (!productId || !productName) return res.status(400).json({ error: 'Product info is required.' });
    if (!merchants?.length) return res.status(400).json({ error: 'At least one merchant is required.' });
    if (await PriceComparison.findOne({ productId })) return res.status(409).json({ error: 'Comparison for this product already exists.' });
    const best = calcBest(merchants, sellingPrice || 0);
    const entry = await PriceComparison.create({ id: await getNextId(), productId, productName, categorySlug: categorySlug || '', merchants, sellingPrice: sellingPrice || 0, ...best, createdAt: new Date().toISOString() });
    const o = entry.toObject(); delete o._id; delete o.__v; res.status(201).json(o);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await PriceComparison.findOne({ id });
    if (!item) return res.status(404).json({ error: 'Comparison not found.' });
    const { merchants, sellingPrice, productName, categorySlug } = req.body;
    if (merchants) item.merchants = merchants; if (sellingPrice !== undefined) item.sellingPrice = sellingPrice; if (productName) item.productName = productName; if (categorySlug) item.categorySlug = categorySlug;
    Object.assign(item, calcBest(item.merchants, item.sellingPrice));
    await item.save(); const o = item.toObject(); delete o._id; delete o.__v; res.json(o);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try { const result = await PriceComparison.findOneAndDelete({ id: parseInt(req.params.id, 10) }); if (!result) return res.status(404).json({ error: 'Comparison not found.' }); res.json({ message: 'Comparison deleted successfully.' }); }
  catch (err) { next(err); }
}

module.exports = { getAll, create, update, remove };
