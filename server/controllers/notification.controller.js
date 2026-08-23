const Notification = require('../models/Notification');
const NotificationCampaign = require('../models/NotificationCampaign');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification, createNotificationsBulk, genId } = require('../utils/notify');

function stripId(doc) { const obj = doc.toObject ? doc.toObject() : { ...doc }; delete obj._id; delete obj.__v; return obj; }

// ---- Customer endpoints (auth) ----

async function getMine(req, res, next) {
  try {
    const items = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
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
    const users = await User.find({ role: { $ne: 'admin' } }, { id: 1 }).lean();
    return { ids: users.map(u => u.id), audience: 'كل العملاء' };
  }
  if (Array.isArray(target.userIds) && target.userIds.length) {
    return { ids: target.userIds, audience: `${target.userIds.length} عميل محدد` };
  }
  if (target.orderStatus) {
    const orders = await Order.find({ status: target.orderStatus }, { userId: 1, customer: 1 }).lean();
    const ids = new Set();
    const phones = [];
    for (const o of orders) {
      if (o.userId) ids.add(o.userId);
      else if (o.customer?.phone) phones.push(String(o.customer.phone).trim());
    }
    // Resolve all legacy phone-only orders in one query instead of N findOne calls.
    if (phones.length) {
      const users = await User.find({ phone: { $in: phones } }, { id: 1 }).lean();
      users.forEach(u => ids.add(u.id));
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
    const campaignId = genId().replace('ntf-', 'cmp-');
    // Single bulk insert instead of one await createNotification per recipient.
    await createNotificationsBulk(ids, { type, title, body, link, coupon: couponPayload, campaignId });

    await NotificationCampaign.create({
      id: campaignId,
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
  try { const items = await NotificationCampaign.find({}).sort({ createdAt: -1 }).limit(200).lean(); res.json(items.map(stripId)); }
  catch (err) { next(err); }
}

async function deleteCampaign(req, res, next) {
  try {
    const id = req.params.id;
    const campaign = await NotificationCampaign.findOne({ id });
    if (!campaign) return res.status(404).json({ error: 'الحملة غير موجودة' });

    const couponCode = campaign.type === 'coupon' ? (campaign.coupon?.code || '').trim() : '';
    let otherCampaignsWithSameCode = 0;
    if (couponCode) {
      otherCampaignsWithSameCode = await NotificationCampaign.countDocuments({
        'coupon.code': couponCode,
        id: { $ne: id },
      });
    }

    let deleteResult = await Notification.deleteMany({ campaignId: id });
    let notificationsDeleted = deleteResult.deletedCount || 0;
    const campaignTime = new Date(campaign.createdAt).getTime();
    // Only fall back for a campaign that actually fanned out and predates campaignId:
    // a zero-recipient campaign has nothing to find, and matching on content alone
    // would delete a look-alike campaign's notifications instead of its own.
    if (notificationsDeleted === 0 && campaign.recipientsCount > 0 && Number.isFinite(campaignTime)) {
      const windowStart = new Date(campaignTime - 5000).toISOString();
      const windowEnd = new Date(campaignTime + 5000).toISOString();
      deleteResult = await Notification.deleteMany({
        // Anything already tagged belongs to a campaign that can be matched exactly.
        campaignId: { $in: [null, ''] },
        type: campaign.type,
        title: campaign.title,
        body: campaign.body,
        createdAt: { $gte: windowStart, $lte: windowEnd },
      });
      notificationsDeleted = deleteResult.deletedCount || 0;
    }

    let couponRemoved = false;
    if (couponCode && otherCampaignsWithSameCode === 0) {
      // Keep shared coupon codes until no other listed campaign references them.
      const couponDeleteResult = await Coupon.deleteOne({ code: couponCode });
      couponRemoved = (couponDeleteResult.deletedCount || 0) > 0;
    }

    await NotificationCampaign.deleteOne({ id });
    res.json({
      message: 'تم الحذف',
      notificationsDeleted,
      couponCode,
      couponRemoved,
      otherCampaignsWithSameCode,
    });
  } catch (err) { next(err); }
}

module.exports = { getMine, markAllRead, markRead, deleteOne, sendToCustomers, getSentCampaigns, deleteCampaign };
