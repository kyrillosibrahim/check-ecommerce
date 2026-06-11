const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');

/**
 * Validates a coupon code for a given account/browser without consuming it.
 * @returns {Promise<{valid:boolean, discountPercentage?:number, error?:string, coupon?:object}>}
 */
async function validateCoupon(rawCode, userId, browserId) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { valid: false, error: 'الكود مطلوب' };

  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.active) return { valid: false, error: 'الكود غير صحيح' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: 'انتهت صلاحية الكود' };
  }

  // Blocked if already used by this account OR this browser.
  const or = [];
  if (userId) or.push({ userId });
  if (browserId) or.push({ browserId });
  if (or.length) {
    const used = await CouponUsage.findOne({ code, $or: or });
    if (used) return { valid: false, error: 'تم استخدام هذا الكود من قبل' };
  }

  return { valid: true, discountPercentage: coupon.discountPercentage, coupon };
}

/** Records consumption of a coupon for this account + browser. */
async function markCouponUsed(rawCode, userId, browserId) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return;
  try {
    await CouponUsage.create({
      code,
      userId: userId || '',
      browserId: browserId || '',
      usedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[coupons] failed to record usage:', err.message);
  }
}

module.exports = { validateCoupon, markCouponUsed };
