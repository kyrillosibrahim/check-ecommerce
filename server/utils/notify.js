const Notification = require('../models/Notification');

function genId() {
  return 'ntf-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Creates one notification for a single user. Safe to call from anywhere —
 * failures are swallowed so a notification never breaks the parent request.
 * @param {string} userId
 * @param {{type?:string,title?:string,body?:string,link?:string,coupon?:object}} payload
 */
async function createNotification(userId, payload = {}) {
  if (!userId) return null;
  try {
    return await Notification.create({
      id: genId(),
      userId,
      type: payload.type || 'general',
      title: payload.title || '',
      body: payload.body || '',
      link: payload.link || '',
      coupon: payload.coupon || undefined,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message);
    return null;
  }
}

module.exports = { createNotification, genId };
