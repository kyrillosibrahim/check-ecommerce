const Product = require('../models/Product');
const Favorite = require('../models/Favorite');

async function getFavDoc() {
  let fav = await Favorite.findById('global');
  if (!fav) { fav = await Favorite.create({ _id: 'global', ids: [] }); }
  return fav;
}

async function readFavorites() {
  const fav = await getFavDoc();
  return fav.ids || [];
}

function fixImagePaths(product) {
  const cat = product.categoryFolder;
  const slug = product.slug;
  if (!cat || !slug) return product;
  const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : cat + '/' + slug + '/' + p) : [];
  const obj = product.toObject ? product.toObject() : { ...product };
  obj.mainImages = fixPaths(obj.mainImages);
  obj.swiperImages = fixPaths(obj.swiperImages);
  obj.normalImages = fixPaths(obj.normalImages);
  if (obj._id) delete obj._id; if (obj.__v !== undefined) delete obj.__v;
  return obj;
}

async function getFavorites(req, res, next) {
  try {
    const favIds = await readFavorites();
    const products = await Product.find({ id: { $in: favIds } });
    const validIds = products.map(p => p.id);
    if (validIds.length < favIds.length) { const fav = await getFavDoc(); fav.ids = validIds; await fav.save(); }
    res.json(products.map(fixImagePaths));
  } catch (err) { next(err); }
}

async function getFavoriteIds(req, res, next) {
  try { res.json(await readFavorites()); } catch (err) { next(err); }
}

async function addToFavorites(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required.' });
    const fav = await getFavDoc();
    if (fav.ids.includes(productId)) return res.json({ message: 'Already in favorites.', favorites: fav.ids });
    fav.ids.push(productId); await fav.save();
    res.json({ message: 'Added to favorites.', favorites: fav.ids });
  } catch (err) { next(err); }
}

async function removeFromFavorites(req, res, next) {
  try {
    const { productId } = req.params;
    const fav = await getFavDoc();
    fav.ids = fav.ids.filter(id => id !== productId); await fav.save();
    res.json({ message: 'Removed from favorites.', favorites: fav.ids });
  } catch (err) { next(err); }
}

async function clearFavorites(req, res, next) {
  try { const fav = await getFavDoc(); fav.ids = []; await fav.save(); res.json({ message: 'Favorites cleared.', favorites: [] }); }
  catch (err) { next(err); }
}

function invalidateProductIndex() {}

module.exports = { getFavorites, getFavoriteIds, addToFavorites, removeFromFavorites, clearFavorites, readFavorites, invalidateProductIndex };
