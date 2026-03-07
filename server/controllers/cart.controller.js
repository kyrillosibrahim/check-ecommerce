const path = require('path');
const fse = require('fs-extra');

const CART_FILE = path.join(__dirname, '..', 'data', 'cart.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ── Helpers ──

async function readCart() {
  if (!(await fse.pathExists(CART_FILE))) return [];
  return fse.readJson(CART_FILE);
}

async function writeCart(cart) {
  await fse.writeJson(CART_FILE, cart, { spaces: 2 });
}

/**
 * Check if a productId exists in the cart.
 * Exported for use by other controllers (e.g. getProductById).
 */
async function isInCart(productId) {
  const cart = await readCart();
  return cart.some(item => item.productId === productId);
}

/**
 * Find a product's data by scanning all category folders.
 * Returns the raw product.json data or null.
 */
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
 * GET /api/cart/getcart
 * Returns cart items with full product data.
 */
async function getCart(req, res, next) {
  try {
    const cart = await readCart();
    const result = [];

    for (const item of cart) {
      const product = await findProductById(item.productId);
      if (product) {
        result.push({ product, quantity: item.quantity });
      }
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/addtocart
 * Body: { productId: string, quantity?: number }
 */
async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required.' });

    const cart = await readCart();
    const existing = cart.find(item => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    await writeCart(cart);
    return res.json({ message: 'Added to cart.', cart });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/cart/update
 * Body: { productId: string, quantity: number }
 */
async function updateCartItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity == null) {
      return res.status(400).json({ error: 'productId and quantity are required.' });
    }

    const cart = await readCart();
    const item = cart.find(i => i.productId === productId);

    if (!item) return res.status(404).json({ error: 'Item not found in cart.' });

    item.quantity = quantity;
    await writeCart(cart);
    return res.json({ message: 'Cart updated.', cart });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart/remove/:productId
 */
async function removeFromCart(req, res, next) {
  try {
    const { productId } = req.params;
    const cart = await readCart();
    const filtered = cart.filter(i => i.productId !== productId);
    await writeCart(filtered);
    return res.json({ message: 'Removed from cart.', cart: filtered });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart/clear
 */
async function clearCart(req, res, next) {
  try {
    await writeCart([]);
    return res.json({ message: 'Cart cleared.', cart: [] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, isInCart, readCart };
