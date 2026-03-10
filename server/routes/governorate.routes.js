const express = require('express');
const router = express.Router();
const { getAllGovernorates, getCitiesByGovernorate, updateGovernorate } = require('../controllers/governorate.controller');

router.get('/', getAllGovernorates);
router.get('/:id/cities', getCitiesByGovernorate);
router.put('/:id', updateGovernorate);

module.exports = router;
