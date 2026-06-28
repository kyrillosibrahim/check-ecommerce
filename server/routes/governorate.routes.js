const express = require('express');
const router = express.Router();
const { getAllGovernorates, getCitiesByGovernorate, updateGovernorate } = require('../controllers/governorate.controller');
const { adminAuth } = require('../middleware/auth.middleware');

router.get('/', getAllGovernorates);
router.get('/:id/cities', getCitiesByGovernorate);
router.put('/:id', adminAuth, updateGovernorate);

module.exports = router;
