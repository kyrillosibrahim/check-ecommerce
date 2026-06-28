const jwt = require('jsonwebtoken');

// Secrets must come from the environment — no hardcoded fallbacks. server.js
// validates their presence at startup (fail-fast) before any route is mounted.
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the JWT from the Authorization header and attaches the decoded
 * payload to req.user = { id, phone, role }. Returns 401 when missing/invalid.
 */
function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, phone: decoded.phone, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، سجّل الدخول من جديد' });
  }
}

/**
 * Sets req.user when a valid token is present, but never rejects the request.
 * Used on public endpoints that want to personalize when the user is known.
 */
function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.id, phone: decoded.phone, role: decoded.role };
    }
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Authorizes admin-only endpoints. The dashboard authenticates client-side and
 * does not send a user JWT, so it sends a shared secret via the `x-admin-key`
 * header instead. A logged-in admin JWT (role === 'admin') is also accepted.
 */
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key && key === ADMIN_API_KEY) return next();
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin') {
        req.user = { id: decoded.id, phone: decoded.phone, role: decoded.role };
        return next();
      }
    }
  } catch {
    /* fall through to 403 */
  }
  return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة' });
}

module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.adminAuth = adminAuth;
