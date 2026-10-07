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

  // Guests are tracked by browser only, so one of the two ids is required.
  const or = [];
  if (userId) or.push({ userId });
  if (browserId) or.push({ browserId });
  if (!or.length) return { valid: false, error: 'تعذّر التحقق من الكود، حدّث الصفحة وحاول مرة أخرى' };

  // Blocked if this issue of the code was already used by this account OR this browser.
  const used = await CouponUsage.findOne({ code, issueId: coupon.issueId || '', $or: or });
  if (used) return { valid: false, error: 'تم استخدام هذا الكود من قبل' };

  return { valid: true, discountPercentage: coupon.discountPercentage, coupon };
}

/**
 * Atomically records consumption of a coupon for this account + browser.
 * Returns true if this call consumed it, false if it was already consumed
 * (unique-index violation from a concurrent order) or on error — callers must
 * only apply the discount when this returns true.
 */
async function markCouponUsed(rawCode, userId, browserId, issueId = '') {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code || (!userId && !browserId)) return false;
  try {
    await CouponUsage.create({
      code,
      issueId,
      userId: userId || '',
      browserId: browserId || '',
      usedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    if (err && err.code === 11000) return false; // already used (race-safe)
    console.error('[coupons] failed to record usage:', err.message);
    return false;
  }
}

module.exports = { validateCoupon, markCouponUsed };
