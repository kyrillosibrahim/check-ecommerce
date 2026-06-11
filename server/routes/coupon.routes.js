const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { validateCoupon } = require('../utils/coupons');

const router = express.Router();

// Validates a coupon for the logged-in user + browser without consuming it.
router.post('/validate', auth, async (req, res, next) => {
  try {
    const { code, browserId } = req.body || {};
    const result = await validateCoupon(code, req.user.id, browserId);
    if (!result.valid) return res.status(400).json({ valid: false, error: result.error });
    res.json({ valid: true, discountPercentage: result.discountPercentage });
  } catch (err) { next(err); }
});

module.exports = router;
