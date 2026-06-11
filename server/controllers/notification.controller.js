const Notification = require('../models/Notification');
const NotificationCampaign = require('../models/NotificationCampaign');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification, genId } = require('../utils/notify');

function stripId(doc) { const obj = doc.toObject(); delete obj._id; delete obj.__v; return obj; }

// ---- Customer endpoints (auth) ----

async function getMine(req, res, next) {
  try {
    const items = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.json({ notifications: items.map(stripId), unreadCount });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try { await Notification.updateMany({ userId: req.user.id, read: false }, { read: true }); res.json({ message: 'ok' }); }
  catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try { await Notification.updateOne({ id: req.params.id, userId: req.user.id }, { read: true }); res.json({ message: 'ok' }); }
  catch (err) { next(err); }
}

async function deleteOne(req, res, next) {
  try { await Notification.deleteOne({ id: req.params.id, userId: req.user.id }); res.json({ message: 'ok' }); }
  catch (err) { next(err); }
}

// ---- Admin endpoints (adminAuth) ----

// Resolves the list of recipient user ids for a campaign target.
async function resolveRecipients(target) {
  // target: 'all' | { userIds: [] } | { orderStatus: '...' }
  if (!target || target === 'all') {
    const users = await User.find({ role: { $ne: 'admin' } }, { id: 1 });
    return { ids: users.map(u => u.id), audience: 'كل العملاء' };
  }
  if (Array.isArray(target.userIds) && target.userIds.length) {
    return { ids: target.userIds, audience: `${target.userIds.length} عميل محدد` };
  }
  if (target.orderStatus) {
    const orders = await Order.find({ status: target.orderStatus });
    const ids = new Set();
    for (const o of orders) {
      if (o.userId) { ids.add(o.userId); continue; }
      const phone = o.customer?.phone;
      if (phone) { const u = await User.findOne({ phone: String(phone).trim() }, { id: 1 }); if (u) ids.add(u.id); }
    }
    return { ids: [...ids], audience: `حالة الطلب: ${target.orderStatus}` };
  }
  return { ids: [], audience: 'لا أحد' };
}

async function sendToCustomers(req, res, next) {
  try {
    const { type = 'general', title = '', body = '', link = '', coupon, target } = req.body || {};
    if (!body.trim() && !title.trim()) return res.status(400).json({ error: 'الرسالة مطلوبة' });

    let couponPayload;
    if (type === 'coupon') {
      const code = (coupon?.code || '').trim().toUpperCase();
      const pct = Number(coupon?.discountPercentage) || 0;
      if (!code || !pct) return res.status(400).json({ error: 'كود الخصم ونسبته مطلوبان' });
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await Coupon.findOneAndUpdate(
        { code },
        { code, discountPercentage: pct, expiresAt, active: true, createdAt: new Date().toISOString() },
        { upsert: true }
      );
      couponPayload = { code, discountPercentage: pct, expiresAt };
    }

    const { ids, audience } = await resolveRecipients(target);
    for (const userId of ids) {
      await createNotification(userId, { type, title, body, link, coupon: couponPayload });
    }

    await NotificationCampaign.create({
      id: genId().replace('ntf-', 'cmp-'),
      type, title, body, link,
      coupon: couponPayload,
      audience,
      recipientsCount: ids.length,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'تم الإرسال', sent: ids.length, audience });
  } catch (err) { next(err); }
}

async function getSentCampaigns(_req, res, next) {
  try { const items = await NotificationCampaign.find({}).sort({ createdAt: -1 }).limit(200); res.json(items.map(stripId)); }
  catch (err) { next(err); }
}

module.exports = { getMine, markAllRead, markRead, deleteOne, sendToCustomers, getSentCampaigns };
