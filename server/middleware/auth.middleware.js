const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'check-secret-key-2026';

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

module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;
