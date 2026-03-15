const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const Settings = require('../models/Settings');
const Product = require('../models/Product');

const DEFAULT_SETTINGS = {
  _id: 'global', logo: '',
  colors: { primaryLight: '#101b3a', primaryDark: '#101b3a', secondaryLight: '#1bbc9b', secondaryDark: '#20c9a6' },
  social: { facebook: '', instagram: '', whatsapp: '', phone: '' },
  bestSellingProducts: [], bestSellingBrands: [],
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

    let favSet = new Set(); let cartMap = new Map();
    try { const { readFavorites } = require('./favorite.controller'); favSet = new Set(await readFavorites()); } catch {}
    try { const { readCart } = require('./cart.controller'); const cart = await readCart(); cartMap = new Map(cart.map(c => [c.productId, c.quantity])); } catch {}

    if (obj.bestSellingProducts?.length) {
      const products = await Product.find({ id: { $in: obj.bestSellingProducts } }, { __v: 0 });
      const productMap = new Map(products.map(p => [p.id, p]));
      const seen = new Set();
      obj.bestSellingProducts = obj.bestSellingProducts
        .filter(id => { if (seen.has(id) || !productMap.has(id)) return false; seen.add(id); return true; })
        .map(id => {
          const p = fixImagePaths(productMap.get(id));
          p.inFavorite = favSet.has(id); const qty = cartMap.get(id); p.inCart = !!qty; p.cartQuantity = qty || 0;
          return p;
        });
    }

    delete obj.cartCount; delete obj.favoritesCount;
    res.json(obj);
  } catch (err) { res.status(500).json({ error: 'Failed to read settings.' }); }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    const body = req.body;

    if (req.file) {
      await deleteFile(settings.logo).catch(() => {});
      settings.logo = await uploadFile(req.file.path, 'settings');
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

    settings.markModified('colors'); settings.markModified('social');
    await settings.save();
    const obj = settings.toObject(); delete obj._id; delete obj.__v;
    res.json(obj);
  } catch (err) { console.error('[Settings Update Error]', err); res.status(500).json({ error: 'Failed to update settings.' }); }
};
