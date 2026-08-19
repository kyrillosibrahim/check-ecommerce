const express = require('express');
const mongoose = require('mongoose');
const CustomerActivity = require('../models/CustomerActivity');
const SiteVisit = require('../models/SiteVisit');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { adminAuth, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

const MAX_PATH = 300, MAX_TITLE = 200, MAX_DEVICE = 64, MAX_NAME = 80, MAX_PHONE = 30;
const MAX_DURATION = 4 * 60 * 60; // Longer than 4h is a parked tab, not reading.
const MAX_BATCH = 20;
const MAX_DELETE_IDS = 200;

// Facebook/Meta crawler ranges: link-preview bots report ordinary browser names,
// so only the address distinguishes them from real visitors.
const BOT_IP_PREFIXES = ['57.141.', '31.13.', '66.220.', '69.171.', '173.252.', '69.63.', '129.134.'];
const CLOUD_IP_PREFIXES = ['54.', '13.57.', '45.247.', '45.243.', '45.241.'];
const BOT_IP_REGEX = new RegExp(`^(?:${[...BOT_IP_PREFIXES, ...CLOUD_IP_PREFIXES]
  .map(prefix => prefix.replace(/\./g, '\\.'))
  .join('|')})`);

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

router.get('/funnel', adminAuth, async (req, res) => {
  try {
    const MIN_DURATION_SECONDS = 2;
    const from = req.query.from || null;
    const to = req.query.to || null;
    const dateFilter = {};
    if (from || to) {
      dateFilter.date = {};
      if (from) dateFilter.date.$gte = from;
      if (to) dateFilter.date.$lte = to;
    }

    const orderDate = {
      $ifNull: [
        '$date',
        { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', onNull: null } },
      ],
    };
    const orderFilter = {};
    if (from || to) {
      const conditions = [];
      if (from) conditions.push({ $gte: [orderDate, from] });
      if (to) conditions.push({ $lte: [orderDate, to] });
      orderFilter.$expr = { $and: conditions };
    }

    const [visits, activity, carts, orders] = await Promise.all([
      // This is looser than the funnel: SiteVisit logs any page open, while
      // CustomerActivity requires a minimum dwell time, so they are not directly comparable.
      SiteVisit.aggregate([
        { $match: dateFilter },
        {
          $facet: {
            rawTraffic: [
              { $match: { ipAddress: { $not: BOT_IP_REGEX } } },
              {
                $group: {
                  _id: null,
                  deviceIds: { $addToSet: '$deviceId' },
                  ipAddresses: { $addToSet: '$ipAddress' },
                  records: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  devices: { $size: '$deviceIds' },
                  ips: {
                    $size: {
                      $filter: {
                        input: '$ipAddresses',
                        as: 'ip',
                        cond: { $and: [{ $ne: ['$$ip', ''] }, { $ne: ['$$ip', null] }] },
                      },
                    },
                  },
                  records: 1,
                },
              },
            ],
            excluded: [
              { $match: { ipAddress: BOT_IP_REGEX } },
              { $group: { _id: '$deviceId', hits: { $sum: 1 } } },
              {
                $group: {
                  _id: null,
                  botDevices: { $sum: 1 },
                  botHits: { $sum: '$hits' },
                },
              },
            ],
          },
        },
      ]),
      CustomerActivity.aggregate([
        { $match: { ...dateFilter, ipAddress: { $not: BOT_IP_REGEX } } },
        {
          $group: {
            _id: '$deviceId',
            paths: { $addToSet: '$path' },
            ipAddresses: { $addToSet: '$ipAddress' },
          },
        },
        {
          $project: {
            _id: 0,
            ipAddresses: {
              $filter: {
                input: '$ipAddresses',
                as: 'ip',
                cond: { $and: [{ $ne: ['$$ip', ''] }, { $ne: ['$$ip', null] }] },
              },
            },
            viewedProduct: {
              $anyElementTrue: {
                $map: {
                  input: '$paths',
                  as: 'path',
                  in: { $regexMatch: { input: { $ifNull: ['$$path', ''] }, regex: /^\/product\// } },
                },
              },
            },
            reachedCart: {
              $and: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: '$paths',
                      as: 'path',
                      in: { $regexMatch: { input: { $ifNull: ['$$path', ''] }, regex: /^\/product\// } },
                    },
                  },
                },
                { $in: ['/cart', '$paths'] },
              ],
            },
            reachedCheckout: {
              $and: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: '$paths',
                      as: 'path',
                      in: { $regexMatch: { input: { $ifNull: ['$$path', ''] }, regex: /^\/product\// } },
                    },
                  },
                },
                { $in: ['/cart', '$paths'] },
                { $in: ['/checkout', '$paths'] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            visitorDevices: { $sum: 1 },
            viewedProductDevices: { $sum: { $cond: ['$viewedProduct', 1, 0] } },
            reachedCartDevices: { $sum: { $cond: ['$reachedCart', 1, 0] } },
            reachedCheckoutDevices: { $sum: { $cond: ['$reachedCheckout', 1, 0] } },
            visitorIpSets: { $push: '$ipAddresses' },
            viewedProductIpSets: { $push: { $cond: ['$viewedProduct', '$ipAddresses', []] } },
            reachedCartIpSets: { $push: { $cond: ['$reachedCart', '$ipAddresses', []] } },
            reachedCheckoutIpSets: { $push: { $cond: ['$reachedCheckout', '$ipAddresses', []] } },
          },
        },
        {
          $project: {
            _id: 0,
            visitors: {
              devices: '$visitorDevices',
              ips: {
                $size: {
                  $reduce: {
                    input: '$visitorIpSets',
                    initialValue: [],
                    in: { $setUnion: ['$$value', '$$this'] },
                  },
                },
              },
            },
            viewedProduct: {
              devices: '$viewedProductDevices',
              ips: {
                $size: {
                  $reduce: {
                    input: '$viewedProductIpSets',
                    initialValue: [],
                    in: { $setUnion: ['$$value', '$$this'] },
                  },
                },
              },
            },
            reachedCart: {
              devices: '$reachedCartDevices',
              ips: {
                $size: {
                  $reduce: {
                    input: '$reachedCartIpSets',
                    initialValue: [],
                    in: { $setUnion: ['$$value', '$$this'] },
                  },
                },
              },
            },
            reachedCheckout: {
              devices: '$reachedCheckoutDevices',
              ips: {
                $size: {
                  $reduce: {
                    input: '$reachedCheckoutIpSets',
                    initialValue: [],
                    in: { $setUnion: ['$$value', '$$this'] },
                  },
                },
              },
            },
          },
        },
      ]),
      Cart.aggregate([
        { $match: { 'items.0': { $exists: true } } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  carts: { $sum: 1 },
                  items: { $sum: { $size: '$items' } },
                },
              },
            ],
            guests: [
              { $match: { userId: /^guest:/ } },
              { $count: 'n' },
            ],
          },
        },
      ]),
      Order.aggregate([
        { $match: orderFilter },
        { $count: 'n' },
      ]),
    ]);

    const visitStats = visits[0] || {};
    const activityStats = activity[0] || {};
    const cartStats = carts[0] || {};

    res.json({
      range: { from, to },
      minDwellSeconds: MIN_DURATION_SECONDS,
      stages: [
        { key: 'visitors', label: 'زوار', devices: activityStats.visitors?.devices || 0, ips: activityStats.visitors?.ips || 0, unit: 'device' },
        { key: 'viewedProduct', label: 'شافوا منتج', devices: activityStats.viewedProduct?.devices || 0, ips: activityStats.viewedProduct?.ips || 0, unit: 'device' },
        { key: 'reachedCart', label: 'وصلوا للسلة', devices: activityStats.reachedCart?.devices || 0, ips: activityStats.reachedCart?.ips || 0, unit: 'device' },
        { key: 'reachedCheckout', label: 'بدأوا الدفع', devices: activityStats.reachedCheckout?.devices || 0, ips: activityStats.reachedCheckout?.ips || 0, unit: 'device' },
        { key: 'ordered', label: 'أتمّوا الطلب', count: orders[0]?.n || 0, unit: 'order' },
      ],
      rawTraffic: {
        devices: visitStats.rawTraffic?.[0]?.devices || 0,
        ips: visitStats.rawTraffic?.[0]?.ips || 0,
        records: visitStats.rawTraffic?.[0]?.records || 0,
      },
      abandonedCarts: {
        carts: cartStats.totals?.[0]?.carts || 0,
        items: cartStats.totals?.[0]?.items || 0,
        guestCarts: cartStats.guests?.[0]?.n || 0,
      },
      excluded: {
        botDevices: visitStats.excluded?.[0]?.botDevices || 0,
        botHits: visitStats.excluded?.[0]?.botHits || 0,
      },
    });
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

// Admin-only, unlike the POST '/' ingest route above which is public by design.
router.post('/delete-many', adminAuth, async (req, res) => {
  try {
    if (!Array.isArray(req.body?.ids)) {
      return res.status(400).json({ message: 'ids must be an array' });
    }

    const ids = req.body.ids
      .slice(0, MAX_DELETE_IDS)
      .filter(id => mongoose.Types.ObjectId.isValid(id));
    if (ids.length === 0) {
      return res.status(400).json({ message: 'لا توجد معرّفات صالحة' });
    }

    const result = await CustomerActivity.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: result.deletedCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Guard before the query: an invalid id would surface as a 500 cast error.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'معرّف غير صالح' });
    }

    const doc = await CustomerActivity.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'السجل غير موجود' });

    res.json({ success: true, deleted: 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
