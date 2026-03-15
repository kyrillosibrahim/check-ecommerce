const path = require('path');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

async function getCartDoc() {
  let cart = await Cart.findById('global');
  if (!cart) { cart = await Cart.create({ _id: 'global', items: [] }); }
  return cart;
}

async function readCart() {
  const cart = await getCartDoc();
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
    const items = await readCart();
    const result = [];
    for (const item of items) {
      const product = await Product.findOne({ id: item.productId });
      if (product) result.push({ product: fixImagePaths(product), quantity: item.quantity });
    }
    res.json(result);
  } catch (err) { next(err); }
}

async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required.' });
    const cart = await getCartDoc();
    const existing = cart.items.find(i => i.productId === productId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ productId, quantity });
    await cart.save();
    res.json({ message: 'Added to cart.', cart: cart.items });
  } catch (err) { next(err); }
}

async function updateCartItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity == null) return res.status(400).json({ error: 'productId and quantity are required.' });
    const cart = await getCartDoc();
    const item = cart.items.find(i => i.productId === productId);
    if (!item) return res.status(404).json({ error: 'Item not found in cart.' });
    item.quantity = quantity; await cart.save();
    res.json({ message: 'Cart updated.', cart: cart.items });
  } catch (err) { next(err); }
}

async function removeFromCart(req, res, next) {
  try {
    const { productId } = req.params;
    const cart = await getCartDoc();
    cart.items = cart.items.filter(i => i.productId !== productId);
    await cart.save(); res.json({ message: 'Removed from cart.', cart: cart.items });
  } catch (err) { next(err); }
}

async function clearCart(req, res, next) {
  try { const cart = await getCartDoc(); cart.items = []; await cart.save(); res.json({ message: 'Cart cleared.', cart: [] }); }
  catch (err) { next(err); }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, readCart };
