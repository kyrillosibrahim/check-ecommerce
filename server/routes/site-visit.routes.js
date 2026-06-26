const express = require('express');
const SiteVisit = require('../models/SiteVisit');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/site-visits  — public, called by the store frontend on load
router.post('/', async (req, res) => {
  try {
    const { deviceId, deviceName, userAgent } = req.body || {};
    if (!deviceId || !deviceName) {
      return res.status(400).json({ message: 'deviceId and deviceName are required' });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';

    const visit = await SiteVisit.findOneAndUpdate(
      { deviceId, date: today },
      {
        $inc: { visitCount: 1 },
        $set: {
          deviceName,
          userAgent: userAgent || req.headers['user-agent'] || '',
          ipAddress: ip,
          lastVisitAt: new Date(),
        },
        $setOnInsert: { deviceId, date: today },
      },
      { upsert: true, new: true }
    );

    res.json(visit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/site-visits?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=200  — admin only
router.get('/', adminAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
    const filter = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to)   filter.date.$lte = req.query.to;
    }

    const visits = await SiteVisit.find(filter)
      .sort({ date: -1, visitCount: -1 })
      .limit(limit)
      .select('-userAgent -__v');

    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/site-visits  — admin maintenance
router.delete('/', adminAuth, async (_req, res) => {
  try {
    await SiteVisit.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
