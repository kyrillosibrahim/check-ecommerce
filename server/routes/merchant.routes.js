const express = require('express');
const {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
} = require('../controllers/merchant.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getAllMerchants);
router.get('/:id', getMerchantById);
router.post('/', adminAuth, createMerchant);
router.put('/:id', adminAuth, updateMerchant);
router.delete('/:id', adminAuth, deleteMerchant);

module.exports = router;
