const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const Banner = require('../models/Banner');
const { cacheGet, cacheSet, cacheDel, MIN } = require('../utils/cache.util');

const CACHE_KEY = 'banners:all';

async function getNextId() { const last = await Banner.findOne({}, { id: 1 }).sort({ id: -1 }); return last ? last.id + 1 : 1; }

async function getAllBanners(_req, res, next) {
  try {
    const cached = cacheGet(CACHE_KEY);
    if (cached) return res.json(cached);

    const banners = await Banner.find({}, { _id: 0, __v: 0 }).lean();
    cacheSet(CACHE_KEY, banners, 15 * MIN);
    res.json(banners);
  } catch (err) { next(err); }
}

async function createBanner(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Banner image is required.' });
    const link = (req.body.link || '').trim();
    const page = (req.body.page || 'home').trim();
    const imageUrl = await uploadFile(req.file.path, 'banners');
    const newBanner = await Banner.create({ id: await getNextId(), image: imageUrl, link, page });
    cacheDel(CACHE_KEY);
    const obj = newBanner.toObject(); delete obj._id; delete obj.__v;
    res.status(201).json(obj);
  } catch (err) { next(err); }
}

async function updateBanner(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const banner = await Banner.findOne({ id });
    if (!banner) return res.status(404).json({ error: 'Banner not found.' });
    if (req.body.link !== undefined) banner.link = req.body.link.trim();
    if (req.body.page !== undefined) banner.page = req.body.page.trim();
    if (req.file) {
      await deleteFile(banner.image).catch(() => {});
      banner.image = await uploadFile(req.file.path, 'banners');
    }
    await banner.save();
    cacheDel(CACHE_KEY);
    const obj = banner.toObject(); delete obj._id; delete obj.__v;
    res.json(obj);
  } catch (err) { next(err); }
}

async function deleteBanner(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const banner = await Banner.findOneAndDelete({ id });
    if (!banner) return res.status(404).json({ error: 'Banner not found.' });
    await deleteFile(banner.image).catch(() => {});
    cacheDel(CACHE_KEY);
    res.json({ message: 'Banner deleted successfully.' });
  } catch (err) { next(err); }
}

module.exports = { getAllBanners, createBanner, updateBanner, deleteBanner };
