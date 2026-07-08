const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const Settings = require('../models/Settings');
const Product = require('../models/Product');

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
  const obj = product.toObject ? product.toObject() : { ...product };
  obj.mainImages = fixPaths(obj.mainImages); obj.swiperImages = fixPaths(obj.swiperImages); obj.normalImages = fixPaths(obj.normalImages);
  if (obj.images) obj.images = fixPaths(obj.images);
  if (obj._id) delete obj._id; if (obj.__v !== undefined) delete obj.__v;
  return obj;
}

exports.getSettings = async (_req, res) => {
  try {
    const settings = await getSettingsDoc();
    const obj = settings.toObject(); delete obj._id; delete obj.__v;
    delete obj.cartCount; delete obj.favoritesCount;
    res.json(obj);
  } catch (err) { res.status(500).json({ error: 'Failed to read settings.' }); }
};

exports.getHomeProducts = async (_req, res) => {
  try {
    const settings = await getSettingsDoc();
    const productIds = settings.bestSellingProducts || [];
    if (!productIds.length) return res.json([]);

    const products = await Product.find({ id: { $in: productIds } }, { __v: 0 }).lean();
    const productMap = new Map(products.map(p => [p.id, p]));

    let favSet = new Set(); let cartMap = new Map();
    try { const { readFavorites } = require('./favorite.controller'); favSet = new Set(await readFavorites()); } catch {}
    try { const { readCart } = require('./cart.controller'); const cart = await readCart(); cartMap = new Map(cart.map(c => [c.productId, c.quantity])); } catch {}

    const seen = new Set();
    const result = productIds
      .filter(id => { if (seen.has(id) || !productMap.has(id)) return false; seen.add(id); return true; })
      .map(id => {
        const p = fixImagePaths(productMap.get(id));
        p.inFavorite = favSet.has(id); const qty = cartMap.get(id); p.inCart = !!qty; p.cartQuantity = qty || 0;
        return p;
      });

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
    const obj = settings.toObject(); delete obj._id; delete obj.__v;
    res.json(obj);
  } catch (err) { console.error('[Settings Update Error]', err); res.status(500).json({ error: 'Failed to update settings.' }); }
};
