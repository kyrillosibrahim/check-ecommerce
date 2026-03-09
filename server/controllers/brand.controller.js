const path = require('path');
const fse = require('fs-extra');
const { generateSlug } = require('../utils/slug.util');

const DATA_FILE = path.join(__dirname, '..', 'data', 'brands.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'brands');

async function readBrands() {
  if (!(await fse.pathExists(DATA_FILE))) {
    await fse.writeJson(DATA_FILE, [], { spaces: 2 });
    return [];
  }
  return fse.readJson(DATA_FILE);
}

async function writeBrands(brands) {
  await fse.writeJson(DATA_FILE, brands, { spaces: 2 });
}

function getNextId(brands) {
  if (brands.length === 0) return 1;
  return Math.max(...brands.map(b => b.id)) + 1;
}

// GET /api/brands
async function getAllBrands(_req, res, next) {
  try {
    const brands = await readBrands();
    res.json(brands);
  } catch (err) {
    next(err);
  }
}

// POST /api/brands
async function createBrand(req, res, next) {
  try {
    const { name, link } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required.' });
    }

    const brands = await readBrands();
    const slug = generateSlug(name.trim());

    if (brands.find(b => b.slug === slug)) {
      return res.status(409).json({ error: 'Brand already exists.' });
    }

    // Handle image upload
    let imagePath = '';
    if (req.file) {
      await fse.ensureDir(UPLOADS_DIR);
      const ext = path.extname(req.file.originalname) || '.webp';
      const filename = `${slug}${ext}`;
      const dest = path.join(UPLOADS_DIR, filename);
      await fse.move(req.file.path, dest, { overwrite: true });
      imagePath = `brands/${filename}`;
    }

    const newBrand = { id: getNextId(brands), name: name.trim(), slug, image: imagePath, link: (link || '').trim() };
    brands.push(newBrand);
    await writeBrands(brands);

    res.status(201).json(newBrand);
  } catch (err) {
    next(err);
  }
}

// PUT /api/brands/:id
async function updateBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, link } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required.' });
    }

    const brands = await readBrands();
    const index = brands.findIndex(b => b.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    const slug = generateSlug(name.trim());
    const duplicate = brands.find(b => b.slug === slug && b.id !== id);
    if (duplicate) {
      return res.status(409).json({ error: 'A brand with this name already exists.' });
    }

    // Handle image replacement
    if (req.file) {
      await fse.ensureDir(UPLOADS_DIR);
      // Delete old image if exists
      if (brands[index].image) {
        const oldPath = path.join(__dirname, '..', 'uploads', brands[index].image);
        await fse.remove(oldPath).catch(() => {});
      }
      const ext = path.extname(req.file.originalname) || '.webp';
      const filename = `${slug}${ext}`;
      const dest = path.join(UPLOADS_DIR, filename);
      await fse.move(req.file.path, dest, { overwrite: true });
      brands[index].image = `brands/${filename}`;
    }

    brands[index].name = name.trim();
    brands[index].slug = slug;
    if (link !== undefined) brands[index].link = (link || '').trim();
    await writeBrands(brands);

    res.json(brands[index]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/brands/:id
async function deleteBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const brands = await readBrands();
    const index = brands.findIndex(b => b.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    // Delete image file
    if (brands[index].image) {
      const imgPath = path.join(__dirname, '..', 'uploads', brands[index].image);
      await fse.remove(imgPath).catch(() => {});
    }

    brands.splice(index, 1);
    await writeBrands(brands);

    res.json({ message: 'Brand deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllBrands, createBrand, updateBrand, deleteBrand };
