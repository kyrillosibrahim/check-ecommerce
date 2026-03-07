const express = require('express');
const router = express.Router();
const { getFavorites, addToFavorites, removeFromFavorites, clearFavorites } = require('../controllers/favorite.controller');

router.get('/getfavorit', getFavorites);
router.post('/addtofavorit', addToFavorites);
router.delete('/remove/:productId', removeFromFavorites);
router.delete('/clear', clearFavorites);

module.exports = router;
