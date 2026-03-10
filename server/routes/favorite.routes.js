const express = require('express');
const router = express.Router();
const { getFavorites, getFavoriteIds, addToFavorites, removeFromFavorites, clearFavorites } = require('../controllers/favorite.controller');

router.get('/getfavorit', getFavorites);
router.get('/ids', getFavoriteIds);
router.post('/addtofavorit', addToFavorites);
router.delete('/remove/:productId', removeFromFavorites);
router.delete('/clear', clearFavorites);

module.exports = router;
