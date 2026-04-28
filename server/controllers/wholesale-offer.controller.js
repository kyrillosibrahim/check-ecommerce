const { generateSlug } = require('../utils/slug.util');
const { uploadFile, deleteFile } = require('../utils/cloudinary.util');
const WholesaleOffer = require('../models/WholesaleOffer');

async function uploadImages(files, folder) {
  if (!files || files.length === 0) return [];
  const urls = [];
  for (const file of files) {
    const url = await uploadFile(file.path, folder);
    urls.push(url);
  }
  return urls;
}

function clean(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id) delete obj._id;
  if (obj.__v !== undefined) delete obj.__v;
  return obj;
}

async function listOffers(_req, res, next) {
  try {
    const offers = await WholesaleOffer.find({}, { __v: 0 }).sort({ createdAt: -1 });
    res.json(offers.map(clean));
  } catch (err) { next(err); }
}

async function getOffer(req, res, next) {
  try {
    const offer = await WholesaleOffer.findOne({ $or: [{ id: req.params.id }, { slug: req.params.id }] });
    if (!offer) return res.status(404).json({ error: 'Wholesale offer not found.' });
    res.json(clean(offer));
  } catch (err) { next(err); }
}

async function createOffer(req, res, next) {
  try {
    const body = req.body;
    const title = body.title || body.productName;
    if (!title) return res.status(400).json({ error: 'title is required.' });

    const slug = body.slug || generateSlug(title);
    if (!slug) return res.status(400).json({ error: 'Could not generate a valid slug from title.' });

    const offerId = body.id || ('wholesale-' + slug);
    const cloudFolder = `wholesale/${slug}`;

    const existing = await WholesaleOffer.findOne({ id: offerId });
    if (existing) {
      if (req.query.overwrite === 'true') {
        const old = existing.toObject();
        const allImages = [...(old.mainImages || []), ...(old.swiperImages || []), ...(old.normalImages || [])];
        await Promise.all(allImages.map(url => deleteFile(url).catch(() => {})));
        await WholesaleOffer.deleteOne({ id: old.id });
      } else {
        return res.status(409).json({ error: 'Wholesale offer "' + title + '" already exists.', slug });
      }
    }

    const files = req.files || {};
    const mainImages = await uploadImages(files.mainImages, `${cloudFolder}/main`);
    const swiperImages = await uploadImages(files.swiperImages, `${cloudFolder}/swiper`);
    const normalImages = await uploadImages(files.normalImages, `${cloudFolder}/normal`);

    const wholesale = parseFloat(body.wholesalePrice) || 0;
    const original = parseFloat(body.originalPrice) || parseFloat(body.price) || 0;
    const discounted = parseFloat(body.discountedPrice) || 0;
    const discountPercentage = original > 0 ? Math.round(((original - discounted) / original) * 100) : 0;
    const merchantProfitPercentage = wholesale > 0 ? Math.round(((discounted - wholesale) / wholesale) * 100) : 0;

    const parseSafe = (val) => { if (!val) return undefined; try { return JSON.parse(val); } catch { return val; } };

    const data = {
      id: offerId,
      slug,
      title,
      titleAr: body.titleAr || '',
      description: body.description || '',
      descriptionAr: body.descriptionAr || '',
      descriptionHtml: body.descriptionHtml || '',
      descriptionHtmlAr: body.descriptionHtmlAr || '',
      wholesalePrice: wholesale,
      originalPrice: original,
      discountedPrice: discounted,
      discountPercentage,
      merchantProfitPercentage,
      minWholesaleQuantity: parseInt(body.minWholesaleQuantity) || 0,
      faq: (parseSafe(body.faq) || []).map(f => ({ q: f.q || f.qAr || '', a: f.a || f.aAr || '', qAr: f.qAr || f.q || '', aAr: f.aAr || f.a || '' })),
      offers: parseSafe(body.offers) || [],
      mainImages,
      swiperImages,
      normalImages,
      metaTitle: body.metaTitle || '',
      metaDescription: body.metaDescription || '',
      seoKeywords: parseSafe(body.seoKeywords) || [],
      createdAt: new Date().toISOString(),
    };

    const saved = await WholesaleOffer.create(data);
    return res.status(201).json({ message: 'Wholesale offer created.', offer: clean(saved) });
  } catch (err) { next(err); }
}

async function deleteOffer(req, res, next) {
  try {
    const offer = await WholesaleOffer.findOne({ $or: [{ id: req.params.id }, { slug: req.params.id }] });
    if (!offer) return res.status(404).json({ error: 'Wholesale offer not found.' });
    const allImages = [...(offer.mainImages || []), ...(offer.swiperImages || []), ...(offer.normalImages || [])];
    await Promise.all(allImages.map(url => deleteFile(url).catch(() => {})));
    await WholesaleOffer.deleteOne({ id: offer.id });
    res.json({ message: 'Wholesale offer deleted.' });
  } catch (err) { next(err); }
}

module.exports = { listOffers, getOffer, createOffer, deleteOffer };
