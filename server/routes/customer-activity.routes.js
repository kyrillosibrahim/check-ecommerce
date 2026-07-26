const express = require('express');
const mongoose = require('mongoose');
const CustomerActivity = require('../models/CustomerActivity');
const { adminAuth, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

const MAX_PATH = 300, MAX_TITLE = 200, MAX_DEVICE = 64, MAX_NAME = 80, MAX_PHONE = 30;
const MAX_DURATION = 4 * 60 * 60; // Longer than 4h is a parked tab, not reading.
const MAX_BATCH = 20;

function sanitize(raw, req) {
  const body = raw && typeof raw === 'object' ? raw : {};
  const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const deviceId = clean(body.deviceId, MAX_DEVICE);
  const rawPath = clean(body.path, MAX_PATH);
  if (!deviceId || !rawPath) return null;

  const path = (rawPath.startsWith('/') ? rawPath : `/${rawPath}`).slice(0, MAX_PATH);
  const now = Date.now();
  let enteredAt = new Date(body.enteredAt);
  if (Number.isNaN(enteredAt.getTime()) || Math.abs(enteredAt.getTime() - now) > 24 * 60 * 60 * 1000) {
    enteredAt = new Date(now);
  }

  const rawDuration = Number(body.durationSeconds);
  const durationSeconds = Number.isFinite(rawDuration)
    ? Math.min(MAX_DURATION, Math.max(0, Math.round(rawDuration)))
    : 0;
  // Body ids come from sendBeacon, which cannot send an auth header. A malformed one
  // must degrade the row to anonymous — an ObjectId cast error would reject the batch.
  const rawUserId = clean(req.user?.id, MAX_DEVICE) || clean(body.userId, MAX_DEVICE);
  const userId = mongoose.Types.ObjectId.isValid(rawUserId) ? rawUserId : '';
  const userName = userId ? clean(body.userName, MAX_NAME) : '';
  const userPhone = userId
    ? clean(req.user?.phone, MAX_PHONE) || clean(body.userPhone, MAX_PHONE)
    : '';

  return {
    deviceId,
    deviceName: clean(body.deviceName, MAX_DEVICE),
    userId: userId || null,
    userName,
    userPhone,
    path,
    title: clean(body.title, MAX_TITLE),
    enteredAt,
    durationSeconds,
    date: enteredAt.toISOString().slice(0, 10),
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '',
    userAgent: clean(body.userAgent, 300) || clean(req.headers['user-agent'], 300),
  };
}

router.post('/', optionalAuth, async (req, res) => {
  try {
    const events = Array.isArray(req.body?.events)
      ? req.body.events.slice(0, MAX_BATCH)
      : [req.body];
    const docs = events.map(event => sanitize(event, req)).filter(Boolean);
    if (docs.length === 0) {
      return res.status(400).json({ message: 'deviceId and path are required' });
    }

    await CustomerActivity.insertMany(docs, { ordered: false });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const filter = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }
    if (req.query.deviceId) filter.deviceId = req.query.deviceId;
    if (req.query.onlyRegistered === 'true') filter.userId = { $ne: null };
    if (req.query.q) {
      // String(): a repeated ?q= makes Express hand back an array, and .replace would throw.
      const escaped = String(req.query.q).slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const search = new RegExp(escaped, 'i');
      filter.$or = [
        { userName: search },
        { userPhone: search },
        { deviceName: search },
        { deviceId: search },
        { path: search },
        { title: search },
      ];
    }

    const [activity] = await CustomerActivity.aggregate([
      { $match: filter },
      {
        $facet: {
          items: [
            { $sort: { enteredAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $project: { userAgent: 0, ipAddress: 0, __v: 0 } },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                totalDurationSeconds: { $sum: '$durationSeconds' },
              },
            },
          ],
          devices: [
            { $group: { _id: '$deviceId' } },
            { $count: 'n' },
          ],
          customers: [
            { $match: { userId: { $ne: null } } },
            { $group: { _id: '$userId' } },
            { $count: 'n' },
          ],
        },
      },
    ]);

    const totalEvents = activity.totals[0]?.totalEvents || 0;
    const totalDurationSeconds = activity.totals[0]?.totalDurationSeconds || 0;
    const uniqueDevices = activity.devices[0]?.n || 0;
    const uniqueCustomers = activity.customers[0]?.n || 0;

    res.json({
      items: activity.items,
      total: totalEvents,
      page,
      limit,
      summary: { totalEvents, totalDurationSeconds, uniqueDevices, uniqueCustomers },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/', adminAuth, async (_req, res) => {
  try {
    await CustomerActivity.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
