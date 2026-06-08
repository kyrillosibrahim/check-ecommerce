const express = require('express');
const { getStorage } = require('../controllers/storage.controller');

const router = express.Router();

router.get('/', getStorage);

module.exports = router;
