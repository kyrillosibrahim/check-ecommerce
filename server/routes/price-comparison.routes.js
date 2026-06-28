const express = require('express');
const { getAll, create, update, remove } = require('../controllers/price-comparison.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getAll);
router.post('/', adminAuth, create);
router.put('/:id', adminAuth, update);
router.delete('/:id', adminAuth, remove);

module.exports = router;
