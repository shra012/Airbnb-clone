const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const { validateBody } = require('../middleware/validateRequest');
const {
  travelerDashboard,
  travelerBookings,
  travelerFavorites,
  updateProfile,
  travelerProfileUpdateSchema,
} = require('../controllers/travelerController');

const router = express.Router();

router.use(requireAuth, requireRole('TRAVELER'));

router.get('/dashboard', travelerDashboard);
router.get('/bookings', travelerBookings);
router.get('/favorites', travelerFavorites);
router.put('/profile', validateBody(travelerProfileUpdateSchema), updateProfile);

module.exports = router;
