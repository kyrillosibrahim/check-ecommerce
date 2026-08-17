const path = require('path');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

/** Resolves the cart owner key for an authenticated user or guest browser. */
function cartOwner(req) {
  if (req.user?.id) return req.user.id;
  const bid = String(req.get('x-browser-id') || req.body?.browserId || '').trim();
  return bid ? `guest:${bid}` : '';
}

async function getCartDoc(owner) {
  if (!owner) throw new Error('cartOwner is required');
  let cart = await Cart.findOne({ userId: owner });
  if (!cart) { cart = await Cart.create({ userId: owner, items: [] }); }
  return cart;
}

async function readCart(owner) {
  if (!owner) return [];
  const cart = await getCartDoc(owner);
  return cart.items || [];
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

async function getCart(req, res, next) {
  try {
    const owner = cartOwner(req);
    if (!owner) return res.json([]);
    const items = await readCart(owner);
    if (!items.length) return res.json([]);
    // Fetch all cart products in a single query instead of one findOne per item.
    const products = await Product.find({ id: { $in: items.map(i => i.productId) } }).lean();
    const productMap = new Map(products.map(p => [p.id, p]));
    const result = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product) result.push({ product: fixImagePaths(product), quantity: item.quantity });
    }
    res.json(result);
  } catch (err) { next(err); }
}

async function addToCart(req, res, next) {
  try {
    const owner = cartOwner(req);
    if (!owner) return res.status(400).json({ error: 'browserId is required for guest carts.' });
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required.' });
    const cart = await getCartDoc(owner);
    const existing = cart.items.find(i => i.productId === productId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ productId, quantity });
    await cart.save();
    res.json({ message: 'Added to cart.', cart: cart.items });
  } catch (err) { next(err); }
}

async function updateCartItem(req, res, next) {
  try {
    const owner = cartOwner(req);
    if (!owner) return res.status(400).json({ error: 'browserId is required for guest carts.' });
    const { productId, quantity } = req.body;
    if (!productId || quantity == null) return res.status(400).json({ error: 'productId and quantity are required.' });
    const cart = await getCartDoc(owner);
    const item = cart.items.find(i => i.productId === productId);
    if (!item) return res.status(404).json({ error: 'Item not found in cart.' });
    item.quantity = quantity; await cart.save();
    res.json({ message: 'Cart updated.', cart: cart.items });
  } catch (err) { next(err); }
}

async function removeFromCart(req, res, next) {
  try {
    const owner = cartOwner(req);
    if (!owner) return res.status(400).json({ error: 'browserId is required for guest carts.' });
    const { productId } = req.params;
    const cart = await getCartDoc(owner);
    cart.items = cart.items.filter(i => i.productId !== productId);
    await cart.save(); res.json({ message: 'Removed from cart.', cart: cart.items });
  } catch (err) { next(err); }
}

async function clearCart(req, res, next) {
  try { const owner = cartOwner(req); if (!owner) return res.status(400).json({ error: 'browserId is required for guest carts.' }); const cart = await getCartDoc(owner); cart.items = []; await cart.save(); res.json({ message: 'Cart cleared.', cart: [] }); }
  catch (err) { next(err); }
}

async function mergeGuestCart(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Authentication required.' });
    const browserId = String(req.body?.browserId || '').trim();
    if (!browserId) return res.status(400).json({ error: 'browserId is required.' });
    const guestCart = await Cart.findOne({ userId: `guest:${browserId}` });
    if (!guestCart || !guestCart.items?.length) return res.json({ merged: 0 });

    const userCart = await getCartDoc(req.user.id);
    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(item => item.productId === guestItem.productId);
      if (existing) existing.quantity += guestItem.quantity;
      else userCart.items.push({ productId: guestItem.productId, quantity: guestItem.quantity });
    }
    await userCart.save();
    await Cart.deleteOne({ userId: `guest:${browserId}` });
    res.json(userCart.items);
  } catch (err) { next(err); }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, mergeGuestCart, readCart, cartOwner };
