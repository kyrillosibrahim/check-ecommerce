const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth.middleware');
const { register, login, forgotPassword, resetPassword, getAllUsers, updateUser, deleteUser, saveAddress, changePassword } = require('../controllers/auth.controller');

// Only the account owner may change their own password.
function ownAccount(req, res, next) {
  if (req.user && req.user.id === req.params.id) return next();
  return res.status(403).json({ error: 'غير مصرح بهذا الإجراء' });
}

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/users', adminAuth, getAllUsers);
router.put('/users/:id', adminAuth, updateUser);
router.delete('/users/:id', adminAuth, deleteUser);
router.put('/users/:id/address', auth, saveAddress);
router.put('/users/:id/change-password', auth, ownAccount, changePassword);

module.exports = router;
