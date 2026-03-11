const path = require('path');
const fse = require('fs-extra');
const { generateSlug } = require('../utils/slug.util');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/**
 * Move an array of multer files into a target folder.
 * Returns array of relative paths like "main/img-1.webp"
 */
async function moveFiles(files, targetDir, prefix) {
  const saved = [];
  if (!files || files.length === 0) return saved;

  await fse.ensureDir(targetDir);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = path.extname(file.originalname) || '.webp';
    const filename = `img-${i + 1}${ext}`;
    const dest = path.join(targetDir, filename);
    await fse.move(file.path, dest, { overwrite: true });
    saved.push(`${prefix}/${filename}`);
  }
  return saved;
}

/**
 * POST /api/products
 * Create a new product: folders, images, and product.json
 */
async function createProduct(req, res, next) {
  try {
    const body = req.body;

    // --- Validation ---
    const productName = body.productName || body.title;
    const category = body.category;

    if (!productName || !category) {
      return res.status(400).json({ error: 'productName and category are required.' });
    }

    const slug = body.slug || generateSlug(productName);
    if (!slug) {
      return res.status(400).json({ error: 'Could not generate a valid slug from productName.' });
    }

    // --- Build paths ---
    const categorySlug = body.categoryFolder || generateSlug(category);
    const categoryDir = path.join(UPLOADS_DIR, categorySlug);
    const productDir = path.join(categoryDir, slug);

    // --- Prevent duplicates (unless ?overwrite=true) ---
    if (await fse.pathExists(productDir)) {
      if (req.query.overwrite === 'true') {
        await fse.remove(productDir);
      } else {
        return res.status(409).json({
          error: `Product "${productName}" already exists in category "${category}".`,
          slug,
          category: categorySlug,
        });
      }
    }

    const mainDir = path.join(productDir, 'main');
    const swiperDir = path.join(productDir, 'swiper');
    const normalDir = path.join(productDir, 'normal');
    const dataDir = path.join(productDir, 'data');

    await fse.ensureDir(dataDir);

    // --- Move uploaded images by type ---
    const files = req.files || {};
    const mainFilenames = await moveFiles(files.mainImages, mainDir, 'main');
    const swiperFilenames = await moveFiles(files.swiperImages, swiperDir, 'swiper');
    const normalFilenames = await moveFiles(files.normalImages, normalDir, 'normal');

    // --- Calculate prices ---
    const wholesale = parseFloat(body.wholesalePrice) || 0;
    const original = parseFloat(body.originalPrice) || parseFloat(body.price) || 0;
    const discounted = parseFloat(body.discountedPrice) || 0;

    const discountPercentage = original > 0
      ? Math.round(((original - discounted) / original) * 100)
      : 0;

    const merchantProfitPercentage = wholesale > 0
      ? Math.round(((discounted - wholesale) / wholesale) * 100)
      : 0;

    // --- Parse JSON fields ---
    const parseSafe = (val) => {
      if (!val) return undefined;
      try { return JSON.parse(val); } catch { return val; }
    };

    // --- Build product.json (matching dashboard notbad.json format) ---
    const productData = {
      id: body.id || undefined,
      slug,
      title: productName,
      titleAr: body.titleAr || '',
      description: body.description || '',
      descriptionAr: body.descriptionAr || '',
      descriptionHtml: body.descriptionHtml || '',
      descriptionHtmlAr: body.descriptionHtmlAr || '',
      category,
      categoryId: parseInt(body.categoryId) || 0,
      subcategory: body.subcategory || '',
      brand: body.brand || '',
      merchant: body.merchant || '',
      wholesalePrice: wholesale,
      originalPrice: original,
      discountedPrice: discounted,
      discountPercentage,
      merchantProfitPercentage,
      price: parseFloat(body.price) || original,
      stock: parseInt(body.stock) || 0,
      rating: parseFloat(body.rating) || 0,
      ratingsCount: parseInt(body.ratingsCount) || 0,
      isFeatured: body.isFeatured === 'true' || body.isFeatured === true,
      comingSoon: body.comingSoon === 'true' || body.comingSoon === true,
      tags: parseSafe(body.tags) || [],
      filterTags: parseSafe(body.filterTags) || [],
      productForm: parseSafe(body.productForm) || null,
      faq: (parseSafe(body.faq) || []).map(f => ({ q: f.q || f.qAr || '', a: f.a || f.aAr || '', qAr: f.qAr || f.q || '', aAr: f.aAr || f.a || '' })),
      offers: parseSafe(body.offers) || [],
      mainImages: mainFilenames,
      swiperImages: swiperFilenames,
      normalImages: normalFilenames,
      createdAt: new Date().toISOString(),
    };

    await fse.writeJson(path.join(dataDir, 'product.json'), productData, { spaces: 2 });

    // --- Response ---
    return res.status(201).json({
      message: 'Product created successfully.',
      product: productData,
      folder: productDir,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products
 * List products with optional server-side filtering:
 *   ?category=vitamins        — filter by category folder name
 *   ?search=كولاجين           — search in title, titleAr, brand, tags
 *   ?brand=NOW                — filter by brand name
 *   ?featured=true            — only featured products
 *   ?limit=20                 — max results (default: all)
 */
async function getAllProducts(req, res, next) {
  try {
    let products = [];

    if (!(await fse.pathExists(UPLOADS_DIR))) {
      return res.json(products);
    }

    const { category, search, brand, featured, limit, filterTags: filterTagsParam, hasDiscount, page } = req.query;

    const categories = await fse.readdir(UPLOADS_DIR);

    for (const cat of categories) {
      const catPath = path.join(UPLOADS_DIR, cat);
      const stat = await fse.stat(catPath);
      if (!stat.isDirectory()) continue;

      const productFolders = await fse.readdir(catPath);

      for (const pFolder of productFolders) {
        const jsonPath = path.join(catPath, pFolder, 'data', 'product.json');
        if (await fse.pathExists(jsonPath)) {
          const data = await fse.readJson(jsonPath);

          // --- Server-side filters ---
          // Match category by slug stored in product.json OR by folder name
          if (category && data.category !== category && cat !== category) continue;
          if (brand && data.brand !== brand) continue;
          if (featured === 'true' && !data.isFeatured) continue;
          if (hasDiscount === 'true' && !(data.discountPercentage > 0)) continue;

          if (search) {
            const term = search.toLowerCase();
            const inTitle = (data.title || '').toLowerCase().includes(term);
            const inTitleAr = (data.titleAr || '').toLowerCase().includes(term);
            const inBrand = (data.brand || '').toLowerCase().includes(term);
            const inTags = (data.tags || []).some(t => t.toLowerCase().includes(term));
            const inCategory = (data.category || '').toLowerCase().includes(term);
            if (!inTitle && !inTitleAr && !inBrand && !inTags && !inCategory) continue;
          }

          if (filterTagsParam) {
            const requestedTags = filterTagsParam.split(',');
            const productTags = data.filterTags || [];
            if (!requestedTags.some(t => productTags.includes(t))) continue;
          }

          // Build full image paths
          const imgPrefix = `${cat}/${pFolder}`;
          const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : `${imgPrefix}/${p}`) : [];
          data.mainImages = fixPaths(data.mainImages);
          data.swiperImages = fixPaths(data.swiperImages);
          data.normalImages = fixPaths(data.normalImages);
          if (data.images) data.images = fixPaths(data.images);
          data.categoryFolder = cat;
          products.push(data);
        }
      }
    }

    // Add inCart + cartQuantity to each product
    const { readCart } = require('./cart.controller');
    const cart = await readCart();
    const cartMap = new Map(cart.map(c => [c.productId, c.quantity]));

    // Add inFavorite to each product
    const { readFavorites } = require('./favorite.controller');
    const favIds = await readFavorites();
    const favSet = new Set(favIds);

    for (const p of products) {
      const qty = cartMap.get(p.id);
      p.inCart = !!qty;
      p.cartQuantity = qty || 0;
      p.inFavorite = favSet.has(p.id);
    }

    // Pagination
    const total = products.length;
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 36;
      const start = (pageNum - 1) * limitNum;
      products = products.slice(start, start + limitNum);
      return res.json({ products, total });
    }

    // Apply limit (no pagination)
    if (limit) {
      const max = parseInt(limit, 10);
      if (!isNaN(max) && max > 0) {
        products = products.slice(0, max);
      }
    }

    return res.json(products);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:category/:slug
 * Get a single product
 */
async function getProduct(req, res, next) {
  try {
    const { category, slug } = req.params;
    const jsonPath = path.join(UPLOADS_DIR, category, slug, 'data', 'product.json');

    if (!(await fse.pathExists(jsonPath))) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const data = await fse.readJson(jsonPath);
    // Build full image paths
    const imgPrefix = `${category}/${slug}`;
    const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(category) ? p : `${imgPrefix}/${p}`) : [];
    data.mainImages = fixPaths(data.mainImages);
    data.swiperImages = fixPaths(data.swiperImages);
    data.normalImages = fixPaths(data.normalImages);
    if (data.images) data.images = fixPaths(data.images);
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/by-id/:id
 * Find a single product by its ID across all categories.
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!(await fse.pathExists(UPLOADS_DIR))) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const categories = await fse.readdir(UPLOADS_DIR);

    for (const cat of categories) {
      const catPath = path.join(UPLOADS_DIR, cat);
      const stat = await fse.stat(catPath);
      if (!stat.isDirectory()) continue;

      const productFolders = await fse.readdir(catPath);

      for (const pFolder of productFolders) {
        const jsonPath = path.join(catPath, pFolder, 'data', 'product.json');
        if (await fse.pathExists(jsonPath)) {
          const data = await fse.readJson(jsonPath);
          if (data.id === id) {
            // Build full image paths
            const imgPrefix = `${cat}/${pFolder}`;
            const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : `${imgPrefix}/${p}`) : [];
            data.mainImages = fixPaths(data.mainImages);
            data.swiperImages = fixPaths(data.swiperImages);
            data.normalImages = fixPaths(data.normalImages);
            if (data.images) data.images = fixPaths(data.images);
            // Collect up to 4 related products from same category
            const related = [];
            for (const rFolder of productFolders) {
              if (rFolder === pFolder) continue;
              const rJsonPath = path.join(catPath, rFolder, 'data', 'product.json');
              if (await fse.pathExists(rJsonPath)) {
                const rData = await fse.readJson(rJsonPath);
                const rPrefix = `${cat}/${rFolder}`;
                const fixRelPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : `${rPrefix}/${p}`) : [];
                rData.mainImages = fixRelPaths(rData.mainImages);
                rData.swiperImages = fixRelPaths(rData.swiperImages);
                rData.normalImages = fixRelPaths(rData.normalImages);
                if (rData.images) rData.images = fixRelPaths(rData.images);
                related.push(rData);
                if (related.length >= 4) break;
              }
            }
            data.relatedProducts = related;
            // Cart state
            const { readCart: readCartData } = require('./cart.controller');
            const cartItems = await readCartData();
            const cartEntry = cartItems.find(c => c.productId === id);
            data.inCart = !!cartEntry;
            data.cartQuantity = cartEntry ? cartEntry.quantity : 0;
            // Favorite state
            const { readFavorites } = require('./favorite.controller');
            const favIds = await readFavorites();
            data.inFavorite = favIds.includes(id);
            return res.json(data);
          }
        }
      }
    }

    return res.status(404).json({ error: 'Product not found.' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/products/:category/:slug
 * Delete a product and its folder
 */
async function deleteProduct(req, res, next) {
  try {
    const { category, slug } = req.params;
    const productDir = path.join(UPLOADS_DIR, category, slug);

    if (!(await fse.pathExists(productDir))) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await fse.remove(productDir);

    return res.json({ message: `Product "${slug}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/products/by-ids
 * Body: { ids: string[] }
 * Returns products matching the given IDs.
 */
async function getProductsByIds(req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }

    const idSet = new Set(ids);
    const found = new Map();

    if (!(await fse.pathExists(UPLOADS_DIR))) return res.json([]);

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
          if (idSet.has(data.id)) {
            const imgPrefix = `${cat}/${folder}`;
            const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : `${imgPrefix}/${p}`) : [];
            data.mainImages = fixPaths(data.mainImages);
            data.swiperImages = fixPaths(data.swiperImages);
            data.normalImages = fixPaths(data.normalImages);
            if (data.images) data.images = fixPaths(data.images);
            found.set(data.id, data);
          }
        }
      }
    }

    // Return in same order as requested IDs, skip duplicates
    const seen = new Set();
    const result = [];
    for (const id of ids) {
      if (found.has(id) && !seen.has(id)) {
        result.push(found.get(id));
        seen.add(id);
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { createProduct, getAllProducts, getProduct, getProductById, getProductsByIds, deleteProduct };
