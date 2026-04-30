const express = require('express');
const { Resend } = require('resend');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/notifications/login-alert
router.post('/login-alert', async (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ success: false, message: 'username required' });
  }

  const to = process.env.ALERT_EMAIL_TO;
  const when = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

  try {
    const { data, error } = await resend.emails.send({
      from: 'KaroKan Dashboard <onboarding@resend.dev>',
      to,
      subject: `تنبيه: ${username} سجّل دخول إلى لوحة التحكم`,
      html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;padding:24px;background:#f0f2f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#095da6;padding:20px 24px;color:#fff;">
      <h2 style="margin:0;font-size:20px;">تنبيه دخول لوحة التحكم</h2>
    </div>
    <div style="padding:24px;color:#374151;line-height:1.8;">
      <p style="margin:0 0 16px;font-size:15px;">المستخدم <strong style="color:#095da6;">${username}</strong> فتح لوحة التحكم وسجّل دخول.</p>
      <ul style="margin:0;padding-right:20px;font-size:14px;">
        <li>التوقيت: ${when}</li>
        <li>IP: ${ip}</li>
        <li>المتصفح: ${userAgent}</li>
      </ul>
    </div>
    <div style="background:#f9fafb;padding:14px 24px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">
      KaroKan Dashboard &copy; ${new Date().getFullYear()}
    </div>
  </div>
</div>`,
    });

    if (error) {
      console.error('[login-alert] Resend error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('[login-alert] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
