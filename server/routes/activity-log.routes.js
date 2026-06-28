const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// All activity-log operations are dashboard-only (the dashboard sends x-admin-key).
router.use(adminAuth);

// GET /api/activity-logs?limit=500&username=admin
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 2000);
    const filter = {};
    if (req.query.username) filter.username = req.query.username;
    const logs = await ActivityLog.find(filter).sort({ enteredAt: -1 }).limit(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/activity-logs
router.post('/', async (req, res) => {
  try {
    const { username, path, title, enteredAt, durationSeconds } = req.body || {};
    if (!username || !path || !enteredAt) {
      return res.status(400).json({ message: 'username, path, enteredAt required' });
    }
    const log = await ActivityLog.create({
      username,
      path,
      title: title || '',
      enteredAt: new Date(enteredAt),
      durationSeconds: Math.max(0, Math.floor(Number(durationSeconds) || 0)),
      userAgent: req.headers['user-agent'] || '',
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/activity-logs  — clears all (admin maintenance)
router.delete('/', async (_req, res) => {
  try {
    await ActivityLog.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
