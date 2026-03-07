const express = require('express');
const {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
} = require('../controllers/merchant.controller');

const router = express.Router();

router.get('/', getAllMerchants);
router.get('/:id', getMerchantById);
router.post('/', createMerchant);
router.put('/:id', updateMerchant);
router.delete('/:id', deleteMerchant);

module.exports = router;
