require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kyrilosibrahim012753_db_user:CInQmqDvfBSQRODQ@cluster0.nzqoeeg.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0';

const FILE_PATH = path.join('C:', 'Users', 'kyrillos', 'OneDrive', 'Desktop', 'New folder (3)', '_المنتجات_export_1774451175199.xlsx');

function slugify(text) {
  return text.replace(/\s+/g, '-').replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, '').substring(0, 80);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Read Excel
  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);
  console.log(`Read ${rows.length} rows from Excel`);

  // Collect unique categories and brands
  const categorySet = new Set();
  const brandSet = new Set();

  for (const r of rows) {
    const cat = (r['القسم'] || '').trim();
    const brand = (r['العلامة التجارية'] || '').trim().replace(/[\n\r❤]/g, '').trim();
    if (cat) categorySet.add(cat);
    if (brand) brandSet.add(brand);
  }

  // Create categories
  console.log(`\nCreating ${categorySet.size} categories...`);
  let catId = 1;
  for (const name of categorySet) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({
        id: catId,
        name,
        slug: slugify(name),
        subcategories: [],
      });
      console.log(`  + Category: ${name}`);
    }
    catId++;
  }

  // Create brands
  console.log(`\nCreating ${brandSet.size} brands...`);
  let brandId = 1;
  for (const name of brandSet) {
    if (!name) continue;
    const exists = await Brand.findOne({ name });
    if (!exists) {
      await Brand.create({ id: brandId, name, slug: slugify(name) });
      console.log(`  + Brand: ${name}`);
    }
    brandId++;
  }

  // Import products
  console.log(`\nImporting ${rows.length} products...`);
  let imported = 0, skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const titleAr = (r['اسم المنتج باللغة العربية'] || '').trim();
    const title = (r['اسم المنتج باللغة الانجليزية'] || titleAr).trim();
    if (!titleAr) { skipped++; continue; }

    const category = (r['القسم'] || '').trim();
    const brand = (r['العلامة التجارية'] || '').trim().replace(/[\n\r❤]/g, '').trim();
    const originalPrice = parseFloat(r['سعر قطاعي']) || 0;
    const wholesalePrice = parseFloat(r['سعر جملة']) || 0;
    const discountedPrice = parseFloat(r['سعر البيع']) || 0;
    const stockText = (r['التخزين'] || '0').toString();
    const stock = parseInt(stockText.replace(/[^\d]/g, '')) || 0;
    const status = (r['الحالة'] || '').trim();
    const descriptionAr = (r['وصف المنتج باللغة العربية'] || '').trim();
    const description = (r['وصف المنتج باللغة الانجليزية'] || '').trim();

    const slug = slugify(titleAr || title);
    const productId = `prod-${Date.now()}-${i}`;

    const price = discountedPrice > 0 ? discountedPrice : originalPrice;
    const discountPercentage = (originalPrice > 0 && discountedPrice > 0 && discountedPrice < originalPrice)
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
      : 0;

    try {
      await Product.create({
        id: productId,
        slug,
        categoryFolder: slugify(category),
        title: title || titleAr,
        titleAr,
        description,
        descriptionAr,
        category,
        brand,
        wholesalePrice,
        originalPrice,
        discountedPrice: discountedPrice || originalPrice,
        discountPercentage,
        price,
        stock,
        rating: 0,
        ratingsCount: 0,
        isFeatured: false,
        comingSoon: status === 'معطل' || originalPrice === 0,
        tags: [],
        filterTags: [],
        mainImages: [],
        swiperImages: [],
        normalImages: [],
        createdAt: new Date().toISOString(),
      });
      imported++;
    } catch (err) {
      console.error(`  Error on row ${i}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
