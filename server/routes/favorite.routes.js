const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const { getFavorites, getFavoriteIds, addToFavorites, removeFromFavorites, clearFavorites } = require('../controllers/favorite.controller');

// Favorites are private to the logged-in user.
router.use(auth);

router.get('/getfavorit', getFavorites);
router.get('/ids', getFavoriteIds);
router.post('/addtofavorit', addToFavorites);
router.delete('/remove/:productId', removeFromFavorites);
router.delete('/clear', clearFavorites);

module.exports = router;
