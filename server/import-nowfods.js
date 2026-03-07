/**
 * Import all products from src/assets/nowfods into the backend server.
 * Run with: node import-nowfods.js
 *
 * This reads each product folder, parses price+name.txt & description.txt,
 * copies images, and creates the proper product structure in uploads/vitamins/.
 */

const path = require('path');
const fse = require('fs-extra');

const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets', 'nowfods');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CATEGORY = 'vitamins';
const BRAND = 'Now Foods';

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse price+name.txt
 * Format 1 (no discount): "Product Name\n\n1430 ج.م"
 * Format 2 (discount):    "Product Name\n\n2250 ج.م 22% -\n1750 ج.م"
 */
function parsePriceFile(content) {
  const lines = content.trim().split('\n').filter(l => l.trim());
  const name = lines[0].trim();

  let originalPrice = 0;
  let discountedPrice = 0;
  let discountPercent = 0;

  if (lines.length >= 3) {
    // Has discount: line 1 = "2250 ج.م 22% -", line 2 = "1750 ج.م"
    const origMatch = lines[1].match(/([\d.]+)/);
    const discMatch = lines[1].match(/([\d]+)%/);
    const finalMatch = lines[2].match(/([\d.]+)/);

    originalPrice = origMatch ? parseFloat(origMatch[1]) : 0;
    discountPercent = discMatch ? parseInt(discMatch[1]) : 0;
    discountedPrice = finalMatch ? parseFloat(finalMatch[1]) : 0;
  } else if (lines.length >= 2) {
    // No discount: line 1 = "1430 ج.م"
    const priceMatch = lines[1].match(/([\d.]+)/);
    originalPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    discountedPrice = originalPrice;
  }

  return { name, originalPrice, discountedPrice, discountPercent };
}

async function importProduct(folderName) {
  const folderPath = path.join(ASSETS_DIR, folderName);
  const stat = await fse.stat(folderPath);
  if (!stat.isDirectory()) return null;

  // Read price+name.txt
  const priceFile = path.join(folderPath, 'price+name.txt');
  if (!(await fse.pathExists(priceFile))) {
    console.log(`  ⚠ Skipping "${folderName}" - no price+name.txt`);
    return null;
  }
  const priceContent = await fse.readFile(priceFile, 'utf8');
  const { name, originalPrice, discountedPrice, discountPercent } = parsePriceFile(priceContent);

  // Read description.txt
  const descFile = path.join(folderPath, 'description.txt');
  let description = '';
  if (await fse.pathExists(descFile)) {
    description = (await fse.readFile(descFile, 'utf8')).trim();
  }

  const slug = generateSlug(name);
  const categorySlug = generateSlug(CATEGORY);

  // Build product directory
  const productDir = path.join(UPLOADS_DIR, categorySlug, slug);
  const mainDir = path.join(productDir, 'main');
  const swiperDir = path.join(productDir, 'swiper');
  const normalDir = path.join(productDir, 'normal');
  const dataDir = path.join(productDir, 'data');

  // Remove existing if present
  if (await fse.pathExists(productDir)) {
    await fse.remove(productDir);
  }

  await fse.ensureDir(mainDir);
  await fse.ensureDir(swiperDir);
  await fse.ensureDir(normalDir);
  await fse.ensureDir(dataDir);

  // Copy main images (front.webp, back.webp)
  const mainFilenames = [];
  const frontImg = path.join(folderPath, 'front.webp');
  const backImg = path.join(folderPath, 'back.webp');

  if (await fse.pathExists(frontImg)) {
    await fse.copy(frontImg, path.join(mainDir, 'img-1.webp'));
    mainFilenames.push('main/img-1.webp');
  }
  if (await fse.pathExists(backImg)) {
    await fse.copy(backImg, path.join(mainDir, 'img-2.webp'));
    mainFilenames.push('main/img-2.webp');
  }

  // Copy swiper images (same as main for now)
  const swiperFilenames = [];
  if (await fse.pathExists(frontImg)) {
    await fse.copy(frontImg, path.join(swiperDir, 'img-1.webp'));
    swiperFilenames.push('swiper/img-1.webp');
  }
  if (await fse.pathExists(backImg)) {
    await fse.copy(backImg, path.join(swiperDir, 'img-2.webp'));
    swiperFilenames.push('swiper/img-2.webp');
  }

  // Copy normal images from normal/ subfolder
  const normalFilenames = [];
  const normalSrc = path.join(folderPath, 'normal');
  if (await fse.pathExists(normalSrc)) {
    const normalFiles = await fse.readdir(normalSrc);
    let idx = 1;
    for (const nf of normalFiles) {
      const ext = path.extname(nf).toLowerCase();
      if (['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) {
        const destName = `img-${idx}.webp`;
        await fse.copy(path.join(normalSrc, nf), path.join(normalDir, destName));
        normalFilenames.push(`normal/${destName}`);
        idx++;
      }
    }
  }

  // Build product.json
  const productData = {
    id: `nowfods-${slug}`,
    slug,
    title: name,
    titleAr: name,
    description: description,
    descriptionAr: description,
    category: CATEGORY,
    categoryId: 3,
    brand: BRAND,
    wholesalePrice: 0,
    originalPrice,
    discountedPrice,
    discountPercentage: discountPercent,
    merchantProfitPercentage: 0,
    price: discountedPrice || originalPrice,
    stock: 50,
    rating: 4.5,
    ratingsCount: 0,
    isFeatured: true,
    comingSoon: false,
    tags: ['vitamins', 'supplements', 'now-foods'],
    productForm: null,
    faq: [],
    mainImages: mainFilenames,
    swiperImages: swiperFilenames,
    normalImages: normalFilenames,
    createdAt: new Date().toISOString(),
  };

  await fse.writeJson(path.join(dataDir, 'product.json'), productData, { spaces: 2 });

  return productData;
}

async function main() {
  console.log('=== Importing Now Foods products from assets/nowfods ===\n');

  if (!(await fse.pathExists(ASSETS_DIR))) {
    console.error(`Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }

  const folders = await fse.readdir(ASSETS_DIR);
  let imported = 0;
  let skipped = 0;

  for (const folder of folders) {
    console.log(`Processing: ${folder}`);
    const result = await importProduct(folder);
    if (result) {
      console.log(`  ✓ Imported as "${result.slug}" — ${result.originalPrice} ج.م`);
      imported++;
    } else {
      skipped++;
    }
  }

  console.log(`\n=== Done! Imported: ${imported}, Skipped: ${skipped} ===`);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
