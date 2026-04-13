require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const brandRoutes = require('./routes/brand.routes');
const bannerRoutes = require('./routes/banner.routes');
const cartRoutes = require('./routes/cart.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const authRoutes = require('./routes/auth.routes');
const governorateRoutes = require('./routes/governorate.routes');
const orderRoutes = require('./routes/order.routes');
const merchantRoutes = require('./routes/merchant.routes');
const settingsRoutes = require('./routes/settings.routes');
const priceComparisonRoutes = require('./routes/price-comparison.routes');
const expenseRoutes = require('./routes/expense.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security HTTP Headers ---
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  next();
});

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Serve uploaded images statically ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Root route ---
app.get('/', (_req, res) => {
  res.json({
    name: 'E-Commerce Product Server',
    status: 'running',
    endpoints: {
      'GET  /api/health': 'Health check',
      'GET  /api/products': 'List all products',
      'POST /api/products': 'Create product (multipart/form-data)',
      'GET  /api/products/:category/:slug': 'Get single product',
      'DELETE /api/products/:category/:slug': 'Delete product',
      'GET  /api/categories': 'List all categories',
      'POST /api/categories': 'Create category',
      'PUT  /api/categories/:id': 'Update category',
      'DELETE /api/categories/:id': 'Delete category',
      'GET  /api/brands': 'List all brands',
      'POST /api/brands': 'Create brand (multipart/form-data)',
      'PUT  /api/brands/:id': 'Update brand',
      'DELETE /api/brands/:id': 'Delete brand',
      'GET  /api/banners': 'List all banners',
      'POST /api/banners': 'Create banner (multipart/form-data)',
      'PUT  /api/banners/:id': 'Update banner',
      'DELETE /api/banners/:id': 'Delete banner',
      'GET  /api/cart/getcart': 'Get cart items',
      'POST /api/cart/addtocart': 'Add item to cart',
      'PUT  /api/cart/update': 'Update cart item quantity',
      'DELETE /api/cart/remove/:productId': 'Remove item from cart',
      'DELETE /api/cart/clear': 'Clear cart',
      'GET  /api/favorites/getfavorit': 'Get favorite products',
      'POST /api/favorites/addtofavorit': 'Add to favorites',
      'DELETE /api/favorites/remove/:productId': 'Remove from favorites',
      'DELETE /api/favorites/clear': 'Clear favorites',
      'POST /api/auth/register': 'Register new user',
      'POST /api/auth/login': 'Login with phone + password',
      'POST /api/auth/forgot-password': 'Request OTP for password reset',
      'POST /api/auth/reset-password': 'Reset password with OTP',
      'GET  /api/auth/users': 'List all registered users',
      'GET  /api/governorates': 'List all governorates with shipping costs',
      'GET  /api/governorates/:id/cities': 'List cities for a governorate',
      'GET  /api/orders': 'List all orders',
      'GET  /api/orders/:id': 'Get single order',
      'POST /api/orders': 'Create new order',
      'PUT  /api/orders/:id': 'Update order',
      'GET  /api/merchants': 'List all merchants',
      'GET  /api/merchants/:id': 'Get single merchant',
      'POST /api/merchants': 'Create merchant',
      'PUT  /api/merchants/:id': 'Update merchant',
      'DELETE /api/merchants/:id': 'Delete merchant',
      'GET  /api/settings': 'Get site settings',
      'PUT  /api/settings': 'Update site settings (multipart/form-data)',
      'GET  /api/price-comparisons': 'List all price comparisons',
      'POST /api/price-comparisons': 'Create price comparison',
      'PUT  /api/price-comparisons/:id': 'Update price comparison',
      'DELETE /api/price-comparisons/:id': 'Delete price comparison',
    },
  });
});

// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/governorates', governorateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/price-comparisons', priceComparisonRoutes);
app.use('/api/expenses', expenseRoutes);

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error handling middleware ---
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error.' });
});

// --- Seed governorates if collection is empty ---
async function seedGovernorates() {
  const Governorate = require('./models/Governorate');
  const count = await Governorate.countDocuments();
  if (count === 0) {
    const data = require('./data/governorates.json');
    await Governorate.insertMany(data);
    console.log(`  Seeded ${data.length} governorates`);
  }
}

// --- Start ---
connectDB().then(async () => {
  await seedGovernorates();
  app.listen(PORT, () => {
    console.log(`\n  Product Server running at http://localhost:${PORT}`);
    console.log(`  Uploads dir: ${path.join(__dirname, 'uploads')}\n`);
  });
});
