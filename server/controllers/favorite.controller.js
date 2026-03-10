const path = require('path');
const fse = require('fs-extra');

const FAV_FILE = path.join(__dirname, '..', 'data', 'favorites.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ── Product Index Cache ──
let productIndex = null;   // Map<id, productData>
let indexBuiltAt = 0;
const INDEX_TTL = 60_000;  // rebuild every 60s

async function buildProductIndex() {
  const now = Date.now();
  if (productIndex && (now - indexBuiltAt) < INDEX_TTL) return productIndex;

  const idx = new Map();
  if (!(await fse.pathExists(UPLOADS_DIR))) { productIndex = idx; indexBuiltAt = now; return idx; }

  const categories = await fse.readdir(UPLOADS_DIR);
  await Promise.all(categories.map(async (cat) => {
    const catPath = path.join(UPLOADS_DIR, cat);
    try {
      const stat = await fse.stat(catPath);
      if (!stat.isDirectory()) return;
      const folders = await fse.readdir(catPath);
      await Promise.all(folders.map(async (folder) => {
        const jsonPath = path.join(catPath, folder, 'data', 'product.json');
        if (await fse.pathExists(jsonPath)) {
          try {
            const data = await fse.readJson(jsonPath);
            const imgPrefix = `${cat}/${folder}`;
            const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : `${imgPrefix}/${p}`) : [];
            data.mainImages = fixPaths(data.mainImages);
            data.swiperImages = fixPaths(data.swiperImages);
            data.normalImages = fixPaths(data.normalImages);
            if (data.images) data.images = fixPaths(data.images);
            idx.set(data.id, data);
          } catch { /* skip corrupt files */ }
        }
      }));
    } catch { /* skip */ }
  }));

  productIndex = idx;
  indexBuiltAt = now;
  return idx;
}

// Invalidate cache when products change (called externally if needed)
function invalidateProductIndex() { productIndex = null; }

// ── Helpers ──

async function readFavorites() {
  if (!(await fse.pathExists(FAV_FILE))) return [];
  return fse.readJson(FAV_FILE);
}

async function writeFavorites(favs) {
  await fse.writeJson(FAV_FILE, favs, { spaces: 2 });
}

// ── Route handlers ──

/**
 * GET /api/favorites/getfavorit
 * Returns favorite products with full product data.
 */
async function getFavorites(req, res, next) {
  try {
    const favIds = await readFavorites();
    const idx = await buildProductIndex();
    const result = favIds
      .map(id => idx.get(id))
      .filter(Boolean);
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
 * GET /api/favorites/ids
 * Returns just the array of favorite product IDs (lightweight, no product scanning).
 */
async function getFavoriteIds(req, res, next) {
  try {
    const favIds = await readFavorites();
    return res.json(favIds);
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

module.exports = { getFavorites, getFavoriteIds, addToFavorites, removeFromFavorites, clearFavorites, readFavorites, invalidateProductIndex };
