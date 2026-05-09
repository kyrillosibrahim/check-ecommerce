const express = require('express');
const {
  getAllExternalWebsites,
  createExternalWebsite,
  updateExternalWebsite,
  deleteExternalWebsite,
} = require('../controllers/external-website.controller');

const router = express.Router();

router.get('/', getAllExternalWebsites);
router.post('/', createExternalWebsite);
router.put('/:id', updateExternalWebsite);
router.delete('/:id', deleteExternalWebsite);

module.exports = router;
