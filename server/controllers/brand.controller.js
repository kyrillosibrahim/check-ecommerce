const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const Brand = require('../models/Brand');
const { generateSlug } = require('../utils/slug.util');
const { cacheGet, cacheSet, cacheDel, cacheClear, HOUR } = require('../utils/cache.util');

const CACHE_KEY = 'brands:all';
const PINNED_KEY = 'brands:pinned';
// Multipart bodies send booleans as strings.
const toBool = v => v === true || v === 'true' || v === '1' || v === 'on';

function _invalidate() {
  cacheDel(CACHE_KEY);
  cacheDel(PINNED_KEY);
  cacheClear('categories:');    // detailed categories embed brand data
  cacheClear('settings:featured-brands');
}

async function getNextId() { const last = await Brand.findOne({}, { id: 1 }).sort({ id: -1 }); return last ? last.id + 1 : 1; }

async function getAllBrands(_req, res, next) {
  try {
    const cached = cacheGet(CACHE_KEY);
    if (cached) return res.json(cached);

    const brands = await Brand.find({}, { _id: 0, __v: 0 }).lean();
    cacheSet(CACHE_KEY, brands, HOUR);
    res.json(brands);
  } catch (err) { next(err); }
}

// Names of pinned brands, used to put their products first on category pages.
async function getPinnedBrandNames() {
  const cached = cacheGet(PINNED_KEY);
  if (cached) return cached;
  const names = (await Brand.find({ pinned: true }, { name: 1, _id: 0 }).lean()).map(b => b.name);
  cacheSet(PINNED_KEY, names, HOUR);
  return names;
}

async function createBrand(req, res, next) {
  try {
    const { name, link, imageUrl: bodyImageUrl, pinned } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Brand name is required.' });
    const slug = generateSlug(name.trim());
    if (await Brand.findOne({ slug })) return res.status(409).json({ error: 'Brand already exists.' });
    let imageUrl = bodyImageUrl || '';
    if (req.file) {
      imageUrl = await uploadFile(req.file.path, 'brands');
    }
    const newBrand = await Brand.create({ id: await getNextId(), name: name.trim(), slug, image: imageUrl, link: (link || '').trim(), pinned: toBool(pinned) });
    _invalidate();
    const obj = newBrand.toObject(); delete obj._id; delete obj.__v;
    res.status(201).json(obj);
  } catch (err) { next(err); }
}

async function updateBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, link, imageUrl: bodyImageUrl, pinned } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Brand name is required.' });
    const brand = await Brand.findOne({ id });
    if (!brand) return res.status(404).json({ error: 'Brand not found.' });
    const slug = generateSlug(name.trim());
    if (await Brand.findOne({ slug, id: { $ne: id } })) return res.status(409).json({ error: 'A brand with this name already exists.' });
    if (req.file) {
      await deleteFile(brand.image).catch(() => {});
      brand.image = await uploadFile(req.file.path, 'brands');
    } else if (bodyImageUrl) {
      brand.image = bodyImageUrl;
    }
    brand.name = name.trim(); brand.slug = slug;
    if (link !== undefined) brand.link = (link || '').trim();
    if (pinned !== undefined) brand.pinned = toBool(pinned);
    await brand.save();
    _invalidate();
    const obj = brand.toObject(); delete obj._id; delete obj.__v;
    res.json(obj);
  } catch (err) { next(err); }
}

async function deleteBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const brand = await Brand.findOneAndDelete({ id });
    if (!brand) return res.status(404).json({ error: 'Brand not found.' });
    await deleteFile(brand.image).catch(() => {});
    _invalidate();
    res.json({ message: 'Brand deleted successfully.' });
  } catch (err) { next(err); }
}

module.exports = { getAllBrands, createBrand, updateBrand, deleteBrand, getPinnedBrandNames };
