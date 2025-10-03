const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const {
  travelerDashboard,
  travelerBookings,
  travelerFavorites,
} = require('../controllers/travelerController');

const router = express.Router();

router.use(requireAuth, requireRole('TRAVELER'));

router.get('/dashboard', travelerDashboard);
router.get('/bookings', travelerBookings);
router.get('/favorites', travelerFavorites);

module.exports = router;
