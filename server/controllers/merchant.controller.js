const path = require('path');
const fse = require('fs-extra');

const DATA_FILE = path.join(__dirname, '..', 'data', 'merchants.json');

async function readMerchants() {
  if (!(await fse.pathExists(DATA_FILE))) {
    await fse.writeJson(DATA_FILE, [], { spaces: 2 });
    return [];
  }
  return fse.readJson(DATA_FILE);
}

async function writeMerchants(merchants) {
  await fse.writeJson(DATA_FILE, merchants, { spaces: 2 });
}

function getNextId(merchants) {
  if (merchants.length === 0) return 1;
  return Math.max(...merchants.map(m => m.id)) + 1;
}

// GET /api/merchants
async function getAllMerchants(_req, res, next) {
  try {
    const merchants = await readMerchants();
    res.json(merchants);
  } catch (err) {
    next(err);
  }
}

// GET /api/merchants/:id
async function getMerchantById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const merchants = await readMerchants();
    const merchant = merchants.find(m => m.id === id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found.' });
    }
    res.json(merchant);
  } catch (err) {
    next(err);
  }
}

// POST /api/merchants
async function createMerchant(req, res, next) {
  try {
    const { name, phone, address, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Merchant name is required.' });
    }

    const merchants = await readMerchants();
    const trimmedName = name.trim();

    if (merchants.find(m => m.name === trimmedName)) {
      return res.status(409).json({ error: 'Merchant already exists.' });
    }

    const newMerchant = {
      id: getNextId(merchants),
      name: trimmedName,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      notes: (notes || '').trim(),
      createdAt: new Date().toISOString(),
    };

    merchants.push(newMerchant);
    await writeMerchants(merchants);

    res.status(201).json(newMerchant);
  } catch (err) {
    next(err);
  }
}

// PUT /api/merchants/:id
async function updateMerchant(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, phone, address, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Merchant name is required.' });
    }

    const merchants = await readMerchants();
    const index = merchants.findIndex(m => m.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Merchant not found.' });
    }

    const trimmedName = name.trim();
    const duplicate = merchants.find(m => m.name === trimmedName && m.id !== id);
    if (duplicate) {
      return res.status(409).json({ error: 'A merchant with this name already exists.' });
    }

    merchants[index].name = trimmedName;
    merchants[index].phone = (phone || '').trim();
    merchants[index].address = (address || '').trim();
    merchants[index].notes = (notes || '').trim();

    await writeMerchants(merchants);
    res.json(merchants[index]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/merchants/:id
async function deleteMerchant(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const merchants = await readMerchants();
    const index = merchants.findIndex(m => m.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Merchant not found.' });
    }

    merchants.splice(index, 1);
    await writeMerchants(merchants);

    res.json({ message: 'Merchant deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllMerchants, getMerchantById, createMerchant, updateMerchant, deleteMerchant };
