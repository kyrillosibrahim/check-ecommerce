const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const Settings = require('../models/Settings');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const { cacheGet, cacheSet, cacheClear, MIN, HOUR } = require('../utils/cache.util');

const CACHE_SETTINGS        = 'settings:global';
const CACHE_FEATURED_BRANDS = 'settings:featured-brands';
const CACHE_HOME_PRODUCTS   = 'settings:home-products';

function _invalidate() {
  cacheClear('settings:');
}

const DEFAULT_SETTINGS = {
  _id: 'global', logo: '',
  colors: { primaryLight: '#827e62', primaryDark: '#827e62', secondaryLight: '#1bbc9b', secondaryDark: '#20c9a6' },
  social: { facebook: '', instagram: '', whatsapp: '', phone: '' },
  bestSellingProducts: [], bestSellingBrands: [], naturalProducts: [],
};

async function getSettingsDoc() {
  let settings = await Settings.findById('global');
  if (!settings) { settings = await Settings.create(DEFAULT_SETTINGS); }
  return settings;
}

function fixImagePaths(product) {
  const cat = product.categoryFolder;
  const slug = product.slug;
  if (!cat || !slug) return product;
  const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : cat + '/' + slug + '/' + p) : [];
  const obj = { ...product };
  obj.mainImages = fixPaths(obj.mainImages); obj.swiperImages = fixPaths(obj.swiperImages); obj.normalImages = fixPaths(obj.normalImages);
  if (obj.images) obj.images = fixPaths(obj.images);
  delete obj._id; delete obj.__v;
  return obj;
}

exports.getSettings = async (_req, res) => {
  try {
    const cached = cacheGet(CACHE_SETTINGS);
    if (cached) return res.json(cached);

    const settings = await getSettingsDoc();
    const obj = settings.toObject(); delete obj._id; delete obj.__v;
    delete obj.cartCount; delete obj.favoritesCount;

    cacheSet(CACHE_SETTINGS, obj, 10 * MIN);
    res.json(obj);
  } catch (err) { res.status(500).json({ error: 'Failed to read settings.' }); }
};

exports.getFeaturedBrands = async (_req, res) => {
  try {
    const cached = cacheGet(CACHE_FEATURED_BRANDS);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
      return res.json(cached);
    }

    const settings = await getSettingsDoc();
    const topIds = settings.bestSellingBrands || [];
    const allBrands = await Brand.find({}, { _id: 0, __v: 0 }).lean();

    let result;
    if (!topIds.length) {
      result = allBrands;
    } else {
      const brandMap = new Map(allBrands.map(b => [b.id, b]));
      const ordered = topIds.map(id => brandMap.get(id)).filter(Boolean);
      result = ordered.length ? ordered : allBrands;
    }

    cacheSet(CACHE_FEATURED_BRANDS, result, 30 * MIN);
    res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Failed to load featured brands.' }); }
};

exports.getHomeProducts = async (_req, res) => {
  try {
    const cached = cacheGet(CACHE_HOME_PRODUCTS);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
      return res.json(cached);
    }

    const settings = await getSettingsDoc();
    const productIds = settings.bestSellingProducts || [];
    if (!productIds.length) {
      res.set('Cache-Control', 'public, max-age=1800');
      return res.json([]);
    }

    const products = await Product.find({ id: { $in: productIds } }, { __v: 0 }).lean();
    const productMap = new Map(products.map(p => [p.id, p]));

    const seen = new Set();
    const result = productIds
      .filter(id => { if (seen.has(id) || !productMap.has(id)) return false; seen.add(id); return true; })
      .map(id => fixImagePaths(productMap.get(id)));

    cacheSet(CACHE_HOME_PRODUCTS, result, 10 * MIN);
    res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Failed to load home products.' }); }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    const body = req.body;

    const files = req.files || {};
    if (files.logo?.[0]) {
      await deleteFile(settings.logo).catch(() => {});
      settings.logo = await uploadFile(files.logo[0].path, 'settings');
    }
    if (files.logoAr?.[0]) {
      await deleteFile(settings.logoAr).catch(() => {});
      settings.logoAr = await uploadFile(files.logoAr[0].path, 'settings');
    }
    if (files.logoEn?.[0]) {
      await deleteFile(settings.logoEn).catch(() => {});
      settings.logoEn = await uploadFile(files.logoEn[0].path, 'settings');
    }
    if (files.logoIcon?.[0]) {
      await deleteFile(settings.logoIcon).catch(() => {});
      settings.logoIcon = await uploadFile(files.logoIcon[0].path, 'settings');
    }

    if (body.colors) {
      const colors = typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors;
      settings.colors = { primaryLight: colors.primaryLight || settings.colors.primaryLight, primaryDark: colors.primaryDark || settings.colors.primaryDark, secondaryLight: colors.secondaryLight || settings.colors.secondaryLight, secondaryDark: colors.secondaryDark || settings.colors.secondaryDark };
    }

    if (body.social) {
      const social = typeof body.social === 'string' ? JSON.parse(body.social) : body.social;
      settings.social = { facebook: social.facebook ?? settings.social.facebook, instagram: social.instagram ?? settings.social.instagram, whatsapp: social.whatsapp ?? settings.social.whatsapp, phone: social.phone ?? settings.social.phone };
    }

    if (body.bestSellingProducts !== undefined) { const p = typeof body.bestSellingProducts === 'string' ? JSON.parse(body.bestSellingProducts) : body.bestSellingProducts; settings.bestSellingProducts = Array.isArray(p) ? p : []; }
    if (body.bestSellingBrands !== undefined) { const p = typeof body.bestSellingBrands === 'string' ? JSON.parse(body.bestSellingBrands) : body.bestSellingBrands; settings.bestSellingBrands = Array.isArray(p) ? p : []; }

    if (body.naturalProducts !== undefined) {
      const arr = typeof body.naturalProducts === 'string' ? JSON.parse(body.naturalProducts) : body.naturalProducts;
      settings.naturalProducts = Array.isArray(arr)
        ? arr.filter(i => i && typeof i === 'object').map(i => ({ video: String(i.video || ''), link: String(i.link || '') }))
        : [];
    }

    settings.markModified('colors'); settings.markModified('social'); settings.markModified('naturalProducts');
    await settings.save();

    _invalidate();

    const obj = settings.toObject(); delete obj._id; delete obj.__v;
    res.json(obj);
  } catch (err) { console.error('[Settings Update Error]', err); res.status(500).json({ error: 'Failed to update settings.' }); }
};
