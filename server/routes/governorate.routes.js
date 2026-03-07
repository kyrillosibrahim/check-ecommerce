const express = require('express');
const router = express.Router();
const { getAllGovernorates, getCitiesByGovernorate } = require('../controllers/governorate.controller');

router.get('/', getAllGovernorates);
router.get('/:id/cities', getCitiesByGovernorate);

module.exports = router;
