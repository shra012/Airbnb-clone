const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const {
  getFavorites,
  addFavoriteHandler,
  removeFavoriteHandler,
} = require('../controllers/favoriteController');

const router = express.Router();

router.use(requireAuth, requireRole('TRAVELER'));

router.get('/', getFavorites);
router.post('/:propertyId', addFavoriteHandler);
router.delete('/:propertyId', removeFavoriteHandler);

module.exports = router;
