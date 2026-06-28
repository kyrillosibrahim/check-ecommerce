const express = require('express');
const {
  getAllExternalWebsites,
  createExternalWebsite,
  updateExternalWebsite,
  deleteExternalWebsite,
} = require('../controllers/external-website.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getAllExternalWebsites);
router.post('/', adminAuth, createExternalWebsite);
router.put('/:id', adminAuth, updateExternalWebsite);
router.delete('/:id', adminAuth, deleteExternalWebsite);

module.exports = router;
