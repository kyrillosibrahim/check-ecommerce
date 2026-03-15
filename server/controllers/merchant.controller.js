const Merchant = require('../models/Merchant');

async function getNextId() { const last = await Merchant.findOne({}, { id: 1 }).sort({ id: -1 }); return last ? last.id + 1 : 1; }

async function getAllMerchants(_req, res, next) {
  try { const merchants = await Merchant.find({}, { __v: 0 }); res.json(merchants.map(m => { const o = m.toObject(); delete o._id; return o; })); }
  catch (err) { next(err); }
}

async function getMerchantById(req, res, next) {
  try { const m = await Merchant.findOne({ id: parseInt(req.params.id, 10) }, { __v: 0 }); if (!m) return res.status(404).json({ error: 'Merchant not found.' }); const o = m.toObject(); delete o._id; res.json(o); }
  catch (err) { next(err); }
}

async function createMerchant(req, res, next) {
  try {
    const { name, phone, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Merchant name is required.' });
    if (await Merchant.findOne({ name: name.trim() })) return res.status(409).json({ error: 'Merchant already exists.' });
    const m = await Merchant.create({ id: await getNextId(), name: name.trim(), phone: (phone || '').trim(), address: (address || '').trim(), notes: (notes || '').trim(), createdAt: new Date().toISOString() });
    const o = m.toObject(); delete o._id; delete o.__v; res.status(201).json(o);
  } catch (err) { next(err); }
}

async function updateMerchant(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10); const { name, phone, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Merchant name is required.' });
    if (await Merchant.findOne({ name: name.trim(), id: { $ne: id } })) return res.status(409).json({ error: 'A merchant with this name already exists.' });
    const m = await Merchant.findOneAndUpdate({ id }, { name: name.trim(), phone: (phone || '').trim(), address: (address || '').trim(), notes: (notes || '').trim() }, { new: true, projection: { __v: 0 } });
    if (!m) return res.status(404).json({ error: 'Merchant not found.' });
    const o = m.toObject(); delete o._id; res.json(o);
  } catch (err) { next(err); }
}

async function deleteMerchant(req, res, next) {
  try { const result = await Merchant.findOneAndDelete({ id: parseInt(req.params.id, 10) }); if (!result) return res.status(404).json({ error: 'Merchant not found.' }); res.json({ message: 'Merchant deleted successfully.' }); }
  catch (err) { next(err); }
}

module.exports = { getAllMerchants, getMerchantById, createMerchant, updateMerchant, deleteMerchant };
