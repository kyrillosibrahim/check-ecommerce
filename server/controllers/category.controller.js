const path = require('path');
const fse = require('fs-extra');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { generateSlug } = require('../utils/slug.util');

async function getNextId() {
  const last = await Category.findOne({}, { id: 1 }).sort({ id: -1 });
  return last ? last.id + 1 : 1;
}
function getNextSubId(subcategories) {
  if (!subcategories || subcategories.length === 0) return 1;
  return Math.max(...subcategories.map(s => s.id)) + 1;
}

async function getAllCategories(_req, res, next) {
  try {
    const cats = await Category.find({}, { __v: 0 }).sort({ order: 1, id: 1 });
    res.json(cats.map(c => ({ id: c.id, name: c.name, slug: c.slug, image: c.image || '', filterTags: c.filterTags || [], order: c.order || 0 })));
  } catch (err) { next(err); }
}

async function getDetailedCategories(_req, res, next) {
  try {
    const cats = await Category.find({}, { __v: 0 }).sort({ order: 1, id: 1 });
    const allBrands = await Brand.find({}, { __v: 0 });
    const detailed = cats.map(c => {
      const famousBrands = (c.famousBrands || []).map(bId => { const b = allBrands.find(x => x.id === bId); if (!b) return null; const o = b.toObject(); delete o._id; return o; }).filter(Boolean);
      return { id: c.id, name: c.name, slug: c.slug, image: c.image || '', subcategories: c.subcategories || [], famousBrands, filterTags: c.filterTags || [], order: c.order || 0 };
    });
    res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    res.json(detailed);
  } catch (err) { next(err); }
}

async function reorderCategories(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array is required.' });
    await Promise.all(ids.map((id, index) => Category.updateOne({ id: Number(id) }, { $set: { order: index } })));
    res.json({ message: 'Categories reordered.' });
  } catch (err) { next(err); }
}

async function createCategory(req, res, next) {
  try {
    const { name, imageUrl } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' });
    const slug = generateSlug(name.trim());
    if (await Category.findOne({ slug })) return res.status(409).json({ error: 'Category already exists.' });
    const image = req.file ? '/uploads/categories/' + req.file.filename : (imageUrl || '');
    const newCat = await Category.create({ id: await getNextId(), name: name.trim(), slug, image, subcategories: [], famousBrands: [], filterTags: [] });
    const obj = newCat.toObject(); delete obj._id; delete obj.__v; res.status(201).json(obj);
  } catch (err) { next(err); }
}

async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, famousBrands, filterTags } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' });
    const slug = generateSlug(name.trim());
    if (await Category.findOne({ slug, id: { $ne: id } })) return res.status(409).json({ error: 'A category with this name already exists.' });
    const cat = await Category.findOne({ id });
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    const oldSlug = cat.slug;
    const oldName = cat.name;
    cat.name = name.trim(); cat.slug = slug;
    if (req.file) {
      if (cat.image && !cat.image.startsWith('http')) { const oldPath = path.join(__dirname, '..', cat.image); await fse.remove(oldPath).catch(() => {}); }
      cat.image = '/uploads/categories/' + req.file.filename;
    } else if (req.body.imageUrl) {
      cat.image = req.body.imageUrl;
    }
    if (famousBrands !== undefined) { const p = typeof famousBrands === 'string' ? JSON.parse(famousBrands) : famousBrands; cat.famousBrands = Array.isArray(p) ? p.map(Number) : []; }
    if (filterTags !== undefined) { const p = typeof filterTags === 'string' ? JSON.parse(filterTags) : filterTags; cat.filterTags = Array.isArray(p) ? p : []; }
    await cat.save();

    // Cascade rename to all products referencing the old slug/name
    if (oldSlug !== slug || oldName !== cat.name) {
      await Product.updateMany(
        { $or: [{ category: oldSlug }, { category: oldName }, { categoryFolder: oldSlug }] },
        { $set: { category: slug, categoryFolder: slug } }
      );
    }

    const obj = cat.toObject(); delete obj._id; delete obj.__v; res.json(obj);
  } catch (err) { next(err); }
}

async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const cat = await Category.findOneAndDelete({ id });
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    if (cat.image && !cat.image.startsWith('http')) await fse.remove(path.join(__dirname, '..', cat.image)).catch(() => {});
    for (const sub of (cat.subcategories || [])) { if (sub.image && !sub.image.startsWith('http')) await fse.remove(path.join(__dirname, '..', sub.image)).catch(() => {}); }
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) { next(err); }
}

async function addSubcategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Subcategory name is required.' });
    const cat = await Category.findOne({ id: categoryId });
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    const slug = generateSlug(name.trim());
    if ((cat.subcategories || []).find(s => s.slug === slug)) return res.status(409).json({ error: 'Subcategory already exists.' });
    const image = req.file ? '/uploads/categories/' + req.file.filename : (req.body.imageUrl || '');
    cat.subcategories.push({ id: getNextSubId(cat.subcategories), name: name.trim(), slug, image });
    await cat.save(); const obj = cat.toObject(); delete obj._id; delete obj.__v; res.status(201).json(obj);
  } catch (err) { next(err); }
}

async function updateSubcategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10); const subId = parseInt(req.params.subId, 10);
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Subcategory name is required.' });
    const cat = await Category.findOne({ id: categoryId });
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    const subIndex = (cat.subcategories || []).findIndex(s => s.id === subId);
    if (subIndex === -1) return res.status(404).json({ error: 'Subcategory not found.' });
    const slug = generateSlug(name.trim());
    if (cat.subcategories.find(s => s.slug === slug && s.id !== subId)) return res.status(409).json({ error: 'Subcategory already exists.' });
    const oldSubSlug = cat.subcategories[subIndex].slug;
    const oldSubName = cat.subcategories[subIndex].name;
    cat.subcategories[subIndex].name = name.trim(); cat.subcategories[subIndex].slug = slug;
    if (req.file) {
      const oldImg = cat.subcategories[subIndex].image;
      if (oldImg && !oldImg.startsWith('http')) await fse.remove(path.join(__dirname, '..', oldImg)).catch(() => {});
      cat.subcategories[subIndex].image = '/uploads/categories/' + req.file.filename;
    } else if (req.body.imageUrl) {
      cat.subcategories[subIndex].image = req.body.imageUrl;
    }
    await cat.save();

    // Cascade rename to all products referencing the old subcategory slug/name
    if (oldSubSlug !== slug || oldSubName !== cat.subcategories[subIndex].name) {
      await Product.updateMany(
        { $or: [{ subcategory: oldSubSlug }, { subcategory: oldSubName }] },
        { $set: { subcategory: slug } }
      );
    }

    const obj = cat.toObject(); delete obj._id; delete obj.__v; res.json(obj);
  } catch (err) { next(err); }
}

async function deleteSubcategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10); const subId = parseInt(req.params.subId, 10);
    const cat = await Category.findOne({ id: categoryId });
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    const subIndex = (cat.subcategories || []).findIndex(s => s.id === subId);
    if (subIndex === -1) return res.status(404).json({ error: 'Subcategory not found.' });
    const imgToDelete = cat.subcategories[subIndex].image;
    if (imgToDelete && !imgToDelete.startsWith('http')) await fse.remove(path.join(__dirname, '..', imgToDelete)).catch(() => {});
    cat.subcategories.splice(subIndex, 1); await cat.save();
    const obj = cat.toObject(); delete obj._id; delete obj.__v; res.json(obj);
  } catch (err) { next(err); }
}

module.exports = { getAllCategories, getDetailedCategories, createCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory, reorderCategories };
