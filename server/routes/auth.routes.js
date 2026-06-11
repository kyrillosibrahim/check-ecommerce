const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const { register, login, forgotPassword, resetPassword, getAllUsers, updateUser, deleteUser, saveAddress, changePassword } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/address', auth, saveAddress);
router.put('/users/:id/change-password', changePassword);

module.exports = router;
