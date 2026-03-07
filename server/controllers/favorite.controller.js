const path = require('path');
const fse = require('fs-extra');

const FAV_FILE = path.join(__dirname, '..', 'data', 'favorites.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ── Helpers ──

async function readFavorites() {
  if (!(await fse.pathExists(FAV_FILE))) return [];
  return fse.readJson(FAV_FILE);
}

async function writeFavorites(favs) {
  await fse.writeJson(FAV_FILE, favs, { spaces: 2 });
}

async function findProductById(productId) {
  if (!(await fse.pathExists(UPLOADS_DIR))) return null;
  const categories = await fse.readdir(UPLOADS_DIR);
  for (const cat of categories) {
    const catPath = path.join(UPLOADS_DIR, cat);
    const stat = await fse.stat(catPath);
    if (!stat.isDirectory()) continue;
    const folders = await fse.readdir(catPath);
    for (const folder of folders) {
      const jsonPath = path.join(catPath, folder, 'data', 'product.json');
      if (await fse.pathExists(jsonPath)) {
        const data = await fse.readJson(jsonPath);
        if (data.id === productId) {
          // Prefix image paths with category/product-folder
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

// ── Route handlers ──

/**
 * GET /api/favorites/getfavorit
 * Returns favorite products with full product data.
 */
async function getFavorites(req, res, next) {
  try {
    const favIds = await readFavorites();
    const result = [];
    for (const productId of favIds) {
      const product = await findProductById(productId);
      if (product) result.push(product);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/favorites/addtofavorit
 * Body: { productId: string }
 */
async function addToFavorites(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required.' });

    const favs = await readFavorites();
    if (favs.includes(productId)) {
      return res.json({ message: 'Already in favorites.', favorites: favs });
    }

    favs.push(productId);
    await writeFavorites(favs);
    return res.json({ message: 'Added to favorites.', favorites: favs });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/favorites/remove/:productId
 */
async function removeFromFavorites(req, res, next) {
  try {
    const { productId } = req.params;
    const favs = await readFavorites();
    const filtered = favs.filter(id => id !== productId);
    await writeFavorites(filtered);
    return res.json({ message: 'Removed from favorites.', favorites: filtered });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/favorites/clear
 */
async function clearFavorites(req, res, next) {
  try {
    await writeFavorites([]);
    return res.json({ message: 'Favorites cleared.', favorites: [] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFavorites, addToFavorites, removeFromFavorites, clearFavorites, readFavorites };
