const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const Brand = require('../models/Brand');
const { generateSlug } = require('../utils/slug.util');

async function getNextId() { const last = await Brand.findOne({}, { id: 1 }).sort({ id: -1 }); return last ? last.id + 1 : 1; }

async function getAllBrands(_req, res, next) {
  try { const brands = await Brand.find({}, { __v: 0 }); res.json(brands.map(b => { const o = b.toObject(); delete o._id; return o; })); }
  catch (err) { next(err); }
}

async function createBrand(req, res, next) {
  try {
    const { name, link } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Brand name is required.' });
    const slug = generateSlug(name.trim());
    if (await Brand.findOne({ slug })) return res.status(409).json({ error: 'Brand already exists.' });
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadFile(req.file.path, 'brands');
    }
    const newBrand = await Brand.create({ id: await getNextId(), name: name.trim(), slug, image: imageUrl, link: (link || '').trim() });
    const obj = newBrand.toObject(); delete obj._id; delete obj.__v;
    res.status(201).json(obj);
  } catch (err) { next(err); }
}

async function updateBrand(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, link } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Brand name is required.' });
    const brand = await Brand.findOne({ id });
    if (!brand) return res.status(404).json({ error: 'Brand not found.' });
    const slug = generateSlug(name.trim());
    if (await Brand.findOne({ slug, id: { $ne: id } })) return res.status(409).json({ error: 'A brand with this name already exists.' });
    if (req.file) {
      await deleteFile(brand.image).catch(() => {});
      brand.image = await uploadFile(req.file.path, 'brands');
    }
    brand.name = name.trim(); brand.slug = slug;
    if (link !== undefined) brand.link = (link || '').trim();
    await brand.save();
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
    res.json({ message: 'Brand deleted successfully.' });
  } catch (err) { next(err); }
}

module.exports = { getAllBrands, createBrand, updateBrand, deleteBrand };
