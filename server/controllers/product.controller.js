const { generateSlug } = require('../utils/slug.util');
const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const Product = require('../models/Product');

async function uploadImages(files, folder) {
  if (!files || files.length === 0) return [];
  const urls = [];
  for (const file of files) {
    const url = await uploadFile(file.path, folder);
    urls.push(url);
  }
  return urls;
}

function fixImagePaths(product) {
  const cat = product.categoryFolder;
  const slug = product.slug;
  if (!cat || !slug) {
    const obj = product.toObject ? product.toObject() : { ...product };
    if (obj._id) delete obj._id;
    if (obj.__v !== undefined) delete obj.__v;
    return obj;
  }
  const fixPaths = (arr) => arr ? arr.map(p => p.startsWith('http') || p.startsWith(cat) ? p : cat + '/' + slug + '/' + p) : [];
  const obj = product.toObject ? product.toObject() : { ...product };
  obj.mainImages = fixPaths(obj.mainImages);
  obj.swiperImages = fixPaths(obj.swiperImages);
  obj.normalImages = fixPaths(obj.normalImages);
  if (obj.images) obj.images = fixPaths(obj.images);
  if (obj._id) delete obj._id;
  if (obj.__v !== undefined) delete obj.__v;
  return obj;
}

async function createProduct(req, res, next) {
  try {
    const body = req.body;
    const productName = body.productName || body.title;
    const category = body.category;
    if (!productName || !category) return res.status(400).json({ error: 'productName and category are required.' });

    const slug = body.slug || generateSlug(productName);
    if (!slug) return res.status(400).json({ error: 'Could not generate a valid slug from productName.' });

    const categorySlug = body.categoryFolder || generateSlug(category);
    const cloudFolder = `products/${categorySlug}/${slug}`;

    const existing = await Product.findOne({ id: body.id || (categorySlug + '-' + slug) });
    if (existing) {
      if (req.query.overwrite === 'true') {
        const old = existing.toObject();
        const allImages = [...(old.mainImages || []), ...(old.swiperImages || []), ...(old.normalImages || [])];
        await Promise.all(allImages.map(url => deleteFile(url).catch(() => {})));
        await Product.deleteOne({ id: old.id });
      } else {
        return res.status(409).json({ error: 'Product "' + productName + '" already exists.', slug, category: categorySlug });
      }
    }

    const filesArr = Array.isArray(req.files) ? req.files : [];
    const files = filesArr.reduce((acc, f) => { (acc[f.fieldname] = acc[f.fieldname] || []).push(f); return acc; }, {});
    const mainImages = await uploadImages(files.mainImages, `${cloudFolder}/main`);
    const swiperImages = await uploadImages(files.swiperImages, `${cloudFolder}/swiper`);
    const normalImages = await uploadImages(files.normalImages, `${cloudFolder}/normal`);

    const wholesale = parseFloat(body.wholesalePrice) || 0;
    const original = parseFloat(body.originalPrice) || parseFloat(body.price) || 0;
    const discounted = parseFloat(body.discountedPrice) || 0;
    const discountPercentage = original > 0 ? Math.round(((original - discounted) / original) * 100) : 0;
    const merchantProfitPercentage = wholesale > 0 ? Math.round(((discounted - wholesale) / wholesale) * 100) : 0;

    const parseSafe = (val) => { if (!val) return undefined; try { return JSON.parse(val); } catch { return val; } };

    const productData = {
      id: body.id || (categorySlug + '-' + slug),
      slug,
      categoryFolder: categorySlug,
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
      isWholesaleOffer: body.isWholesaleOffer === 'true' || body.isWholesaleOffer === true,
      tags: parseSafe(body.tags) || [],
      filterTags: parseSafe(body.filterTags) || [],
      productForm: parseSafe(body.productForm) || null,
      faq: (parseSafe(body.faq) || []).map(f => ({ q: f.q || f.qAr || '', a: f.a || f.aAr || '', qAr: f.qAr || f.q || '', aAr: f.aAr || f.a || '' })),
      offers: parseSafe(body.offers) || [],
      comparisonSites: parseSafe(body.comparisonSites) || [],
      mainImages,
      swiperImages,
      normalImages,
      createdAt: new Date().toISOString(),
    };

    if (body.hasVariants === 'true') {
      const variantMeta = parseSafe(body.variants) || [];
      const variants = await Promise.all(variantMeta.map(async (v, i) => {
        const vMain = await uploadImages(files[`variant_${i}_mainImages`], `${cloudFolder}/variants/${i}/main`);
        const vNormal = await uploadImages(files[`variant_${i}_normalImages`], `${cloudFolder}/variants/${i}/normal`);
        return { ...v, mainImages: vMain, normalImages: vNormal };
      }));
      productData.hasVariants = true;
      productData.variantOptionType = body.variantOptionType || '';
      productData.variantOptionTypeAr = body.variantOptionTypeAr || '';
      productData.baseVariantNameAr = body.baseVariantNameAr || '';
      if (body.baseColorHex) productData.baseColorHex = body.baseColorHex;
      productData.variants = variants;
    }

    const saved = await Product.create(productData);
    const obj = saved.toObject(); delete obj._id; delete obj.__v;
    return res.status(201).json({ message: 'Product created successfully.', product: obj, folder: cloudFolder });
  } catch (err) { next(err); }
}

async function getAllProducts(req, res, next) {
  try {
    const { category, subcategory, search, brand, merchant, featured, limit, filterTags: filterTagsParam, hasDiscount, page, sort } = req.query;
    const query = {};
    if (category) query.$or = [{ category }, { categoryFolder: category }];
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = brand;
    if (merchant) query.merchant = merchant;
    if (featured === 'true') query.isFeatured = true;
    if (hasDiscount === 'true') query.discountPercentage = { $gt: 0 };
    if (filterTagsParam) { const tags = filterTagsParam.split(','); query.filterTags = { $in: tags }; }
    // Exclude any legacy products that were saved with isWholesaleOffer:true before
    // wholesale offers got moved to their own collection.
    query.$and = (query.$and || []).concat([{ $or: [{ isWholesaleOffer: { $ne: true } }, { isWholesaleOffer: { $exists: false } }] }]);
    if (search) {
      const term = search.toLowerCase();
      query.$and = [{ $or: [{ title: { $regex: search, $options: 'i' } }, { titleAr: { $regex: search, $options: 'i' } }, { brand: { $regex: search, $options: 'i' } }, { tags: { $elemMatch: { $regex: term, $options: 'i' } } }, { category: { $regex: search, $options: 'i' } }] }];
    }

    // Optional sort (offers page leads with the biggest discounts). Defaults to newest.
    const sortMap = {
      'discount-high': { discountPercentage: -1, createdAt: -1 },
      'discount-low': { discountPercentage: 1, createdAt: -1 },
      'price-low': { price: 1, createdAt: -1 },
      'price-high': { price: -1, createdAt: -1 },
    };
    const sortSpec = sortMap[sort] || { createdAt: -1, _id: -1 };
    const isProfitSort = sort === 'profit-high' || sort === 'profit-low';

    // Cart/favorite flags are personal — only resolve them for an authenticated
    // user (optionalAuth populates req.user). Anonymous visitors get false flags
    // and the storefront manages their cart locally. This also avoids creating a
    // phantom shared cart keyed on userId:undefined.
    let cartMap = new Map();
    let favSet = new Set();
    if (req.user && req.user.id) {
      const { readCart } = require('./cart.controller');
      const { readFavorites } = require('./favorite.controller');
      const [cart, favIds] = await Promise.all([readCart(req.user.id), readFavorites(req.user.id)]);
      cartMap = new Map(cart.map(c => [c.productId, c.quantity]));
      favSet = new Set(favIds);
    }
    const enrich = (obj) => {
      const qty = cartMap.get(obj.id);
      obj.inCart = !!qty; obj.cartQuantity = qty || 0; obj.inFavorite = favSet.has(obj.id);
      return obj;
    };

    // Profit (EGP) is computed, so it can't be sorted/paginated at the DB level.
    // Only this branch loads the full matching set; everything else paginates in DB.
    if (isProfitSort) {
      const docs = await Product.find(query, { __v: 0 }).lean();
      let result = docs.map(p => enrich(fixImagePaths(p)));
      const profitOf = p => {
        const w = p.wholesalePrice || 0;
        const s = p.discountedPrice || p.price || 0;
        return w > 0 ? s - w : 0;
      };
      result.sort((a, b) => sort === 'profit-high' ? profitOf(b) - profitOf(a) : profitOf(a) - profitOf(b));
      const total = result.length;
      if (page && limit) {
        const pageNum = parseInt(page, 10) || 1; const limitNum = parseInt(limit, 10) || 36;
        result = result.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        return res.json({ products: result, total });
      }
      if (limit) { const max = parseInt(limit, 10); if (!isNaN(max) && max > 0) result = result.slice(0, max); }
      return res.json(result);
    }

    // Paginated path — skip/limit + count at the DB level (no full-collection load).
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1; const limitNum = parseInt(limit, 10) || 36;
      const [docs, total] = await Promise.all([
        Product.find(query, { __v: 0 }).sort(sortSpec).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
        Product.countDocuments(query),
      ]);
      return res.json({ products: docs.map(p => enrich(fixImagePaths(p))), total });
    }

    // Unpaginated list (optionally capped by ?limit).
    let dbQuery = Product.find(query, { __v: 0 }).sort(sortSpec);
    if (limit) { const max = parseInt(limit, 10); if (!isNaN(max) && max > 0) dbQuery = dbQuery.limit(max); }
    const docs = await dbQuery.lean();
    return res.json(docs.map(p => enrich(fixImagePaths(p))));
  } catch (err) { next(err); }
}

async function getProduct(req, res, next) {
  try {
    const { category, slug } = req.params;
    const product = await Product.findOne({ slug, $or: [{ category }, { categoryFolder: category }] }, { __v: 0 }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(fixImagePaths(product));
  } catch (err) { next(err); }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findOne({ id: req.params.id }, { __v: 0 }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const obj = fixImagePaths(product);

    const related = await Product.find({ categoryFolder: product.categoryFolder, id: { $ne: product.id } }, { __v: 0 }).limit(4).lean();
    obj.relatedProducts = related.map(fixImagePaths);

    // Personal flags only for an authenticated user (optionalAuth).
    obj.inCart = false; obj.cartQuantity = 0; obj.inFavorite = false;
    if (req.user && req.user.id) {
      const { readCart } = require('./cart.controller');
      const { readFavorites } = require('./favorite.controller');
      const [cart, favIds] = await Promise.all([readCart(req.user.id), readFavorites(req.user.id)]);
      const cartEntry = cart.find(c => c.productId === product.id);
      obj.inCart = !!cartEntry; obj.cartQuantity = cartEntry ? cartEntry.quantity : 0;
      obj.inFavorite = favIds.includes(product.id);
    }

    res.json(obj);
  } catch (err) { next(err); }
}

async function getProductsByIds(req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.json([]);
    const products = await Product.find({ id: { $in: ids } }, { __v: 0 });
    const map = new Map(products.map(p => [p.id, fixImagePaths(p)]));
    const seen = new Set();
    const result = [];
    for (const id of ids) { if (map.has(id) && !seen.has(id)) { result.push(map.get(id)); seen.add(id); } }
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteProduct(req, res, next) {
  try {
    const { category, slug } = req.params;
    const product = await Product.findOneAndDelete({ slug, $or: [{ category }, { categoryFolder: category }] });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const allImages = [...(product.mainImages || []), ...(product.swiperImages || []), ...(product.normalImages || [])];
    Promise.all(allImages.map(url => deleteFile(url).catch(() => {}))).catch(() => {});
    res.json({ message: 'Product "' + slug + '" deleted successfully.' });
  } catch (err) { next(err); }
}

module.exports = { createProduct, getAllProducts, getProduct, getProductById, getProductsByIds, deleteProduct };
