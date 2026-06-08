const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

const MONGO_LIMIT_BYTES = (Number(process.env.MONGO_LIMIT_MB) || 512) * 1024 * 1024;

// GET /api/storage — Cloudinary + MongoDB usage summary (dashboard).
async function getStorage(_req, res) {
  const result = { cloudinary: null, mongo: null };

  // Cloudinary usage
  try {
    const u = await cloudinary.api.usage();
    const credits = u.credits || {};
    result.cloudinary = {
      plan: u.plan,
      creditsUsed: credits.usage ?? 0,
      creditsLimit: credits.limit ?? 0,
      creditsUsedPercent: credits.used_percent ?? 0,
      storageBytes: u.storage?.usage ?? 0,
      bandwidthBytes: u.bandwidth?.usage ?? 0,
      transformations: u.transformations?.usage ?? 0,
      assets: u.objects?.usage ?? 0,
    };
  } catch (e) {
    result.cloudinaryError = e.message || 'تعذّر جلب بيانات Cloudinary';
  }

  // MongoDB stats
  try {
    const s = await mongoose.connection.db.stats();
    const used = (s.storageSize || 0) + (s.indexSize || 0);
    result.mongo = {
      usedBytes: used,
      dataBytes: s.dataSize || 0,
      limitBytes: MONGO_LIMIT_BYTES,
      usedPercent: MONGO_LIMIT_BYTES ? Math.round((used / MONGO_LIMIT_BYTES) * 1000) / 10 : 0,
    };
  } catch (e) {
    result.mongoError = e.message || 'تعذّر جلب بيانات قاعدة البيانات';
  }

  res.json(result);
}

module.exports = { getStorage };
