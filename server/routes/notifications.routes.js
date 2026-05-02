const express = require('express');
const { Resend } = require('resend');

const router = express.Router();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM || 'KaroKan Dashboard <onboarding@resend.dev>';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

if (!RESEND_API_KEY) {
  console.warn('[notifications] RESEND_API_KEY is not set — login alerts will be skipped.');
}
if (!ALERT_EMAIL_TO) {
  console.warn('[notifications] ALERT_EMAIL_TO is not set — login alerts will be skipped.');
}

// POST /api/notifications/login-alert
router.post('/login-alert', async (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ success: false, message: 'username required' });
  }

  if (!resend || !ALERT_EMAIL_TO) {
    console.warn('[login-alert] skipped — missing RESEND_API_KEY or ALERT_EMAIL_TO');
    return res.status(503).json({
      success: false,
      message: 'Email service not configured (missing RESEND_API_KEY or ALERT_EMAIL_TO).',
    });
  }

  const to = ALERT_EMAIL_TO;
  const when = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

  try {
    const { data, error } = await resend.emails.send({
      from: ALERT_EMAIL_FROM,
      to,
      subject: `تنبيه: ${username} سجّل دخول إلى لوحة التحكم`,
      html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);font-family:Tahoma,Arial,sans-serif;min-height:100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#0369a1 100%);padding:32px 28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">🔐</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;">تنبيه أمني</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:13px;">تم تسجيل دخول إلى لوحة التحكم</p>
          </td>
        </tr>

        <!-- Alert Banner -->
        <tr>
          <td style="background:#fef3c7;padding:14px 28px;border-bottom:3px solid #f59e0b;">
            <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;text-align:center;">
              ⚠️ &nbsp; إذا لم تكن أنت من قام بتسجيل الدخول، تواصل فوراً مع المسؤول
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:28px;">

            <!-- User badge -->
            <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
              <div style="font-size:32px;margin-bottom:6px;">👤</div>
              <p style="margin:0;color:#1e40af;font-size:18px;font-weight:700;">${username}</p>
              <p style="margin:4px 0 0;color:#64748b;font-size:12px;">سجّل دخوله بنجاح</p>
            </div>

            <!-- Info cards -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:12px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-right:4px solid #3b82f6;border-radius:8px;padding:14px 16px;display:flex;align-items:center;">
                    <span style="font-size:18px;margin-left:10px;">🕐</span>
                    <div>
                      <div style="color:#94a3b8;font-size:11px;margin-bottom:3px;">التوقيت</div>
                      <div style="color:#1e293b;font-size:14px;font-weight:600;">${when}</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:12px;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-right:4px solid #10b981;border-radius:8px;padding:14px 16px;">
                    <span style="font-size:18px;margin-left:10px;">🌐</span>
                    <div>
                      <div style="color:#94a3b8;font-size:11px;margin-bottom:3px;">عنوان IP</div>
                      <div style="color:#1e293b;font-size:14px;font-weight:600;direction:ltr;text-align:right;">${ip}</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-right:4px solid #8b5cf6;border-radius:8px;padding:14px 16px;">
                    <span style="font-size:18px;margin-left:10px;">💻</span>
                    <div>
                      <div style="color:#94a3b8;font-size:11px;margin-bottom:3px;">المتصفح</div>
                      <div style="color:#1e293b;font-size:13px;font-weight:500;direction:ltr;text-align:right;word-break:break-all;">${userAgent}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:20px 28px;text-align:center;">
            <p style="margin:0;color:#475569;font-size:11px;">
              KaroKan Dashboard &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; رسالة آلية — لا ترد عليها
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (error) {
      console.error('[login-alert] Resend error:', error);
      return res.status(502).json({ success: false, message: error.message });
    }

    console.log(`[login-alert] sent to ${to} for user "${username}" (id=${data?.id})`);
    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('[login-alert] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
