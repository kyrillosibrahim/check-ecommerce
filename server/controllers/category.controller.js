const path = require('path');
const fse = require('fs-extra');
const { generateSlug } = require('../utils/slug.util');

const DATA_FILE = path.join(__dirname, '..', 'data', 'categories.json');
const BRANDS_FILE = path.join(__dirname, '..', 'data', 'brands.json');

async function readCategories() {
  if (!(await fse.pathExists(DATA_FILE))) {
    await fse.writeJson(DATA_FILE, [], { spaces: 2 });
    return [];
  }
  return fse.readJson(DATA_FILE);
}

async function writeCategories(categories) {
  await fse.writeJson(DATA_FILE, categories, { spaces: 2 });
}

async function readBrands() {
  if (!(await fse.pathExists(BRANDS_FILE))) return [];
  return fse.readJson(BRANDS_FILE);
}

function getNextId(categories) {
  if (categories.length === 0) return 1;
  return Math.max(...categories.map(c => c.id)) + 1;
}

function getNextSubId(subcategories) {
  if (!subcategories || subcategories.length === 0) return 1;
  return Math.max(...subcategories.map(s => s.id)) + 1;
}

// GET /api/categories — simple list (id, name, slug, image only)
async function getAllCategories(_req, res, next) {
  try {
    const categories = await readCategories();
    const simple = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image || '',
    }));
    res.json(simple);
  } catch (err) {
    next(err);
  }
}

// GET /api/categories/detailed — full data with subcategories + famous brands
async function getDetailedCategories(_req, res, next) {
  try {
    const categories = await readCategories();
    const allBrands = await readBrands();

    const detailed = categories.map(c => {
      const famousBrands = (c.famousBrands || [])
        .map(brandId => allBrands.find(b => b.id === brandId))
        .filter(Boolean);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image || '',
        subcategories: c.subcategories || [],
        famousBrands,
      };
    });

    res.json(detailed);
  } catch (err) {
    next(err);
  }
}

// POST /api/categories
async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const categories = await readCategories();
    const slug = generateSlug(name.trim());

    if (categories.find(c => c.slug === slug)) {
      return res.status(409).json({ error: 'Category already exists.' });
    }

    const image = req.file
      ? `/uploads/categories/${req.file.filename}`
      : '';

    const newCategory = {
      id: getNextId(categories),
      name: name.trim(),
      slug,
      image,
      subcategories: [],
      famousBrands: [],
    };
    categories.push(newCategory);
    await writeCategories(categories);

    res.status(201).json(newCategory);
  } catch (err) {
    next(err);
  }
}

// PUT /api/categories/:id
async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, famousBrands } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const categories = await readCategories();
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const slug = generateSlug(name.trim());
    const duplicate = categories.find(c => c.slug === slug && c.id !== id);
    if (duplicate) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }

    categories[index].name = name.trim();
    categories[index].slug = slug;

    if (req.file) {
      if (categories[index].image) {
        const oldPath = path.join(__dirname, '..', categories[index].image);
        await fse.remove(oldPath).catch(() => {});
      }
      categories[index].image = `/uploads/categories/${req.file.filename}`;
    }

    // Update famous brands
    if (famousBrands !== undefined) {
      const parsed = typeof famousBrands === 'string' ? JSON.parse(famousBrands) : famousBrands;
      categories[index].famousBrands = Array.isArray(parsed) ? parsed.map(Number) : [];
    }

    await writeCategories(categories);
    res.json(categories[index]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const categories = await readCategories();
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (categories[index].image) {
      const imgPath = path.join(__dirname, '..', categories[index].image);
      await fse.remove(imgPath).catch(() => {});
    }

    const subs = categories[index].subcategories || [];
    for (const sub of subs) {
      if (sub.image) {
        const subImgPath = path.join(__dirname, '..', sub.image);
        await fse.remove(subImgPath).catch(() => {});
      }
    }

    categories.splice(index, 1);
    await writeCategories(categories);

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// ─── Subcategory CRUD ───

// POST /api/categories/:id/subcategories
async function addSubcategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subcategory name is required.' });
    }

    const categories = await readCategories();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    if (!cat.subcategories) cat.subcategories = [];

    const slug = generateSlug(name.trim());
    if (cat.subcategories.find(s => s.slug === slug)) {
      return res.status(409).json({ error: 'Subcategory already exists.' });
    }

    const image = req.file ? `/uploads/categories/${req.file.filename}` : '';

    const newSub = {
      id: getNextSubId(cat.subcategories),
      name: name.trim(),
      slug,
      image,
    };
    cat.subcategories.push(newSub);
    await writeCategories(categories);

    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
}

// PUT /api/categories/:id/subcategories/:subId
async function updateSubcategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const subId = parseInt(req.params.subId, 10);
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subcategory name is required.' });
    }

    const categories = await readCategories();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    const subIndex = (cat.subcategories || []).findIndex(s => s.id === subId);
    if (subIndex === -1) return res.status(404).json({ error: 'Subcategory not found.' });

    const slug = generateSlug(name.trim());
    const duplicate = cat.subcategories.find(s => s.slug === slug && s.id !== subId);
    if (duplicate) return res.status(409).json({ error: 'Subcategory already exists.' });

    cat.subcategories[subIndex].name = name.trim();
    cat.subcategories[subIndex].slug = slug;

    if (req.file) {
      if (cat.subcategories[subIndex].image) {
        const oldPath = path.join(__dirname, '..', cat.subcategories[subIndex].image);
        await fse.remove(oldPath).catch(() => {});
      }
      cat.subcategories[subIndex].image = `/uploads/categories/${req.file.filename}`;
    }

    await writeCategories(categories);
    res.json(cat);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id/subcategories/:subId
async function deleteSubcategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const subId = parseInt(req.params.subId, 10);

    const categories = await readCategories();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    const subIndex = (cat.subcategories || []).findIndex(s => s.id === subId);
    if (subIndex === -1) return res.status(404).json({ error: 'Subcategory not found.' });

    if (cat.subcategories[subIndex].image) {
      const imgPath = path.join(__dirname, '..', cat.subcategories[subIndex].image);
      await fse.remove(imgPath).catch(() => {});
    }

    cat.subcategories.splice(subIndex, 1);
    await writeCategories(categories);

    res.json(cat);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCategories,
  getDetailedCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
