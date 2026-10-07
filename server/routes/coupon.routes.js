const express = require('express');
const { optionalAuth } = require('../middleware/auth.middleware');
const { validateCoupon } = require('../utils/coupons');

const router = express.Router();

// Validates a coupon for the user (if logged in) + browser without consuming it.
// Guests can use coupons too — they are limited per browser.
router.post('/validate', optionalAuth, async (req, res, next) => {
  try {
    const { code, browserId } = req.body || {};
    const result = await validateCoupon(code, req.user?.id || '', browserId);
    if (!result.valid) return res.status(400).json({ valid: false, error: result.error });
    res.json({ valid: true, discountPercentage: result.discountPercentage });
  } catch (err) { next(err); }
});

module.exports = router;
