const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'check-secret-key-2026';

/**
 * Verifies the JWT from the Authorization header and attaches the decoded
 * payload to req.user = { id, phone, role }. Returns 401 when missing/invalid.
 */
module.exports = function auth(req, res, next) {
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
};
