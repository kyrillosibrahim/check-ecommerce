const path = require('path');
const fse = require('fs-extra');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
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
    const cats = await Category.find({}, { __v: 0 });
    res.json(cats.map(c => ({ id: c.id, name: c.name, slug: c.slug, image: c.image || '', filterTags: c.filterTags || [] })));
  } catch (err) { next(err); }
}

async function getDetailedCategories(_req, res, next) {
  try {
    const cats = await Category.find({}, { __v: 0 });
    const allBrands = await Brand.find({}, { __v: 0 });
    const detailed = cats.map(c => {
      const famousBrands = (c.famousBrands || []).map(bId => { const b = allBrands.find(x => x.id === bId); if (!b) return null; const o = b.toObject(); delete o._id; return o; }).filter(Boolean);
      return { id: c.id, name: c.name, slug: c.slug, image: c.image || '', subcategories: c.subcategories || [], famousBrands, filterTags: c.filterTags || [] };
    });
    res.json(detailed);
  } catch (err) { next(err); }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' });
    const slug = generateSlug(name.trim());
    if (await Category.findOne({ slug })) return res.status(409).json({ error: 'Category already exists.' });
    const image = req.file ? '/uploads/categories/' + req.file.filename : '';
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
    cat.name = name.trim(); cat.slug = slug;
    if (req.file) {
      if (cat.image) { const oldPath = path.join(__dirname, '..', cat.image); await fse.remove(oldPath).catch(() => {}); }
      cat.image = '/uploads/categories/' + req.file.filename;
    }
    if (famousBrands !== undefined) { const p = typeof famousBrands === 'string' ? JSON.parse(famousBrands) : famousBrands; cat.famousBrands = Array.isArray(p) ? p.map(Number) : []; }
    if (filterTags !== undefined) { const p = typeof filterTags === 'string' ? JSON.parse(filterTags) : filterTags; cat.filterTags = Array.isArray(p) ? p : []; }
    await cat.save(); const obj = cat.toObject(); delete obj._id; delete obj.__v; res.json(obj);
  } catch (err) { next(err); }
}

async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const cat = await Category.findOneAndDelete({ id });
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    if (cat.image) await fse.remove(path.join(__dirname, '..', cat.image)).catch(() => {});
    for (const sub of (cat.subcategories || [])) { if (sub.image) await fse.remove(path.join(__dirname, '..', sub.image)).catch(() => {}); }
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
    const image = req.file ? '/uploads/categories/' + req.file.filename : '';
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
    cat.subcategories[subIndex].name = name.trim(); cat.subcategories[subIndex].slug = slug;
    if (req.file) { if (cat.subcategories[subIndex].image) await fse.remove(path.join(__dirname, '..', cat.subcategories[subIndex].image)).catch(() => {}); cat.subcategories[subIndex].image = '/uploads/categories/' + req.file.filename; }
    await cat.save(); const obj = cat.toObject(); delete obj._id; delete obj.__v; res.json(obj);
  } catch (err) { next(err); }
}

async function deleteSubcategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10); const subId = parseInt(req.params.subId, 10);
    const cat = await Category.findOne({ id: categoryId });
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    const subIndex = (cat.subcategories || []).findIndex(s => s.id === subId);
    if (subIndex === -1) return res.status(404).json({ error: 'Subcategory not found.' });
    if (cat.subcategories[subIndex].image) await fse.remove(path.join(__dirname, '..', cat.subcategories[subIndex].image)).catch(() => {});
    cat.subcategories.splice(subIndex, 1); await cat.save();
    const obj = cat.toObject(); delete obj._id; delete obj.__v; res.json(obj);
  } catch (err) { next(err); }
}

module.exports = { getAllCategories, getDetailedCategories, createCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory };
