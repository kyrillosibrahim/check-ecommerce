/**
 * migrate.js - Import existing JSON data into MongoDB Atlas
 *
 * Run once: node migrate.js
 * Make sure MONGODB_URI is set in .env before running
 */
require('dotenv').config();
const path = require('path');
const fse = require('fs-extra');
const mongoose = require('mongoose');

const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const Banner = require('./models/Banner');
const Order = require('./models/Order');
const Merchant = require('./models/Merchant');
const Governorate = require('./models/Governorate');
const City = require('./models/City');
const Cart = require('./models/Cart');
const Favorite = require('./models/Favorite');
const PriceComparison = require('./models/PriceComparison');
const Expense = require('./models/Expense');
const Settings = require('./models/Settings');
const Otp = require('./models/Otp');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function readJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!(await fse.pathExists(filePath))) return [];
  return fse.readJson(filePath);
}

async function scanProducts() {
  const products = [];
  if (!(await fse.pathExists(UPLOADS_DIR))) return products;

  const categories = await fse.readdir(UPLOADS_DIR);
  for (const cat of categories) {
    const catPath = path.join(UPLOADS_DIR, cat);
    const stat = await fse.stat(catPath);
    if (!stat.isDirectory()) continue;

    const folders = await fse.readdir(catPath);
    for (const folder of folders) {
      const jsonPath = path.join(catPath, folder, 'data', 'product.json');
      if (await fse.pathExists(jsonPath)) {
        try {
          const data = await fse.readJson(jsonPath);
          data.categoryFolder = cat;
          if (!data.slug) data.slug = folder;
          products.push(data);
        } catch (e) {
          console.warn(`  Skipped corrupt file: ${jsonPath}`);
        }
      }
    }
  }
  return products;
}

async function migrate() {
  console.log('\n  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('  Connected!\n');

  // Users
  const users = await readJson('users.json');
  if (users.length) {
    await User.deleteMany({});
    await User.insertMany(users.map(u => ({ ...u })));
    console.log(`  Users: ${users.length} imported`);
  }

  // Categories
  const categories = await readJson('categories.json');
  if (categories.length) {
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log(`  Categories: ${categories.length} imported`);
  }

  // Brands
  const brands = await readJson('brands.json');
  if (brands.length) {
    await Brand.deleteMany({});
    await Brand.insertMany(brands);
    console.log(`  Brands: ${brands.length} imported`);
  }

  // Banners
  const banners = await readJson('banners.json');
  if (banners.length) {
    await Banner.deleteMany({});
    await Banner.insertMany(banners);
    console.log(`  Banners: ${banners.length} imported`);
  }

  // Orders
  const orders = await readJson('orders.json');
  if (orders.length) {
    await Order.deleteMany({});
    await Order.insertMany(orders);
    console.log(`  Orders: ${orders.length} imported`);
  }

  // Merchants
  const merchants = await readJson('merchants.json');
  if (merchants.length) {
    await Merchant.deleteMany({});
    await Merchant.insertMany(merchants);
    console.log(`  Merchants: ${merchants.length} imported`);
  }

  // Governorates
  const governorates = await readJson('governorates.json');
  if (governorates.length) {
    await Governorate.deleteMany({});
    await Governorate.insertMany(governorates);
    console.log(`  Governorates: ${governorates.length} imported`);
  }

  // Cities
  const cities = await readJson('cities.json');
  if (cities.length) {
    await City.deleteMany({});
    await City.insertMany(cities);
    console.log(`  Cities: ${cities.length} imported`);
  }

  // Cart
  const cartItems = await readJson('cart.json');
  await Cart.findByIdAndUpdate('global', { _id: 'global', items: cartItems }, { upsert: true });
  console.log(`  Cart: ${cartItems.length} items imported`);

  // Favorites
  const favIds = await readJson('favorites.json');
  await Favorite.findByIdAndUpdate('global', { _id: 'global', ids: favIds }, { upsert: true });
  console.log(`  Favorites: ${favIds.length} items imported`);

  // Price Comparisons
  const comparisons = await readJson('price-comparisons.json');
  if (comparisons.length) {
    await PriceComparison.deleteMany({});
    await PriceComparison.insertMany(comparisons);
    console.log(`  Price comparisons: ${comparisons.length} imported`);
  }

  // Expenses
  const expenses = await readJson('expenses.json');
  if (expenses.length) {
    await Expense.deleteMany({});
    await Expense.insertMany(expenses);
    console.log(`  Expenses: ${expenses.length} imported`);
  }

  // Settings
  const settingsFile = path.join(DATA_DIR, 'site-settings.json');
  if (await fse.pathExists(settingsFile)) {
    const settingsData = await fse.readJson(settingsFile);
    await Settings.findByIdAndUpdate('global', { _id: 'global', ...settingsData }, { upsert: true });
    console.log('  Settings: imported');
  }

  // Products (scan uploads folder)
  console.log('\n  Scanning product folders...');
  const products = await scanProducts();
  if (products.length) {
    await Product.deleteMany({});
    await Product.insertMany(products.map(p => ({ ...p })));
    console.log(`  Products: ${products.length} imported`);
  }

  console.log('\n  Migration complete!\n');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
