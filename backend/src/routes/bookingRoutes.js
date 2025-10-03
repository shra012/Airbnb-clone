const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const {
  createBookingHandler,
  listBookingsHandler,
  acceptBookingHandler,
  cancelBookingHandler,
} = require('../controllers/bookingController');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireRole('TRAVELER'), createBookingHandler);
router.get('/', listBookingsHandler);
router.post('/:bookingId/accept', requireRole('OWNER'), acceptBookingHandler);
router.post('/:bookingId/cancel', requireRole('TRAVELER', 'OWNER'), cancelBookingHandler);

module.exports = router;
