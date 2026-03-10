const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'site-settings.json');
const CART_FILE = path.join(__dirname, '..', 'data', 'cart.json');
const FAV_FILE = path.join(__dirname, '..', 'data', 'favorites.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function readSettings() {
  try {
    return fs.readJsonSync(DATA_FILE);
  } catch {
    return {
      logo: '',
      colors: {
        primaryLight: '#4a90d9',
        primaryDark: '#4dabf7',
        secondaryLight: '#1bbc9b',
        secondaryDark: '#20c9a6',
      },
      social: { facebook: '', instagram: '', whatsapp: '', phone: '' },
      bestSellingProducts: [],
      bestSellingBrands: [],
    };
  }
}

function writeSettings(data) {
  fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}

// Helper: find product by ID and fix image paths
async function findProductById(productId) {
  if (!fs.pathExistsSync(UPLOADS_DIR)) return null;
  const categories = fs.readdirSync(UPLOADS_DIR);
  for (const cat of categories) {
    const catPath = path.join(UPLOADS_DIR, cat);
    if (!fs.statSync(catPath).isDirectory()) continue;
    const folders = fs.readdirSync(catPath);
    for (const folder of folders) {
      const jsonPath = path.join(catPath, folder, 'data', 'product.json');
      if (fs.pathExistsSync(jsonPath)) {
        const data = fs.readJsonSync(jsonPath);
        if (data.id === productId) {
          const imgPrefix = `${cat}/${folder}`;
          const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : `${imgPrefix}/${p}`) : [];
          data.mainImages = fixPaths(data.mainImages);
          data.swiperImages = fixPaths(data.swiperImages);
          data.normalImages = fixPaths(data.normalImages);
          if (data.images) data.images = fixPaths(data.images);
          return data;
        }
      }
    }
  }
  return null;
}

// GET /api/settings
exports.getSettings = async (_req, res) => {
  try {
    const settings = readSettings();

    // Read favorites + cart for inFavorite/inCart flags on bestSellingProducts
    let favSet = new Set();
    let cartMap = new Map();
    try {
      const favs = fs.pathExistsSync(FAV_FILE) ? fs.readJsonSync(FAV_FILE) : [];
      favSet = new Set(favs);
    } catch { /* ignore */ }

    try {
      const cart = fs.pathExistsSync(CART_FILE) ? fs.readJsonSync(CART_FILE) : [];
      cartMap = new Map(cart.map(c => [c.productId, c.quantity]));
    } catch { /* ignore */ }

    // Populate bestSellingProducts with full product data + inFavorite/inCart
    if (settings.bestSellingProducts?.length) {
      const seen = new Set();
      const populated = [];
      for (const id of settings.bestSellingProducts) {
        if (seen.has(id)) continue;
        seen.add(id);
        const product = await findProductById(id);
        if (product) {
          product.inFavorite = favSet.has(id);
          const qty = cartMap.get(id);
          product.inCart = !!qty;
          product.cartQuantity = qty || 0;
          populated.push(product);
        }
      }
      settings.bestSellingProducts = populated;
    }

    // Strip legacy keys that are no longer needed
    delete settings.cartCount;
    delete settings.favoritesCount;

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings.' });
  }
};

// PUT /api/settings
exports.updateSettings = (req, res) => {
  try {
    const current = readSettings();
    const body = req.body;

    // Handle logo upload
    if (req.file) {
      // Remove old logo if exists
      if (current.logo) {
        const oldPath = path.join(UPLOADS_DIR, current.logo);
        fs.removeSync(oldPath);
      }
      // Move new logo from temp to uploads
      const ext = path.extname(req.file.originalname) || '.png';
      const logoName = `logo-${Date.now()}${ext}`;
      const destPath = path.join(UPLOADS_DIR, logoName);
      fs.moveSync(req.file.path, destPath, { overwrite: true });
      current.logo = logoName;
    }

    // Update colors
    if (body.colors) {
      const colors = typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors;
      current.colors = {
        primaryLight: colors.primaryLight || current.colors.primaryLight,
        primaryDark: colors.primaryDark || current.colors.primaryDark,
        secondaryLight: colors.secondaryLight || current.colors.secondaryLight,
        secondaryDark: colors.secondaryDark || current.colors.secondaryDark,
      };
    }

    // Update social links
    if (body.social) {
      const social = typeof body.social === 'string' ? JSON.parse(body.social) : body.social;
      current.social = {
        facebook: social.facebook ?? current.social.facebook,
        instagram: social.instagram ?? current.social.instagram,
        whatsapp: social.whatsapp ?? current.social.whatsapp,
        phone: social.phone ?? current.social.phone,
      };
    }

    // Update best selling products
    if (body.bestSellingProducts !== undefined) {
      const products = typeof body.bestSellingProducts === 'string'
        ? JSON.parse(body.bestSellingProducts)
        : body.bestSellingProducts;
      current.bestSellingProducts = Array.isArray(products) ? products : [];
    }

    // Update best selling brands
    if (body.bestSellingBrands !== undefined) {
      const brands = typeof body.bestSellingBrands === 'string'
        ? JSON.parse(body.bestSellingBrands)
        : body.bestSellingBrands;
      current.bestSellingBrands = Array.isArray(brands) ? brands : [];
    }

    writeSettings(current);
    res.json(current);
  } catch (err) {
    console.error('[Settings Update Error]', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};
