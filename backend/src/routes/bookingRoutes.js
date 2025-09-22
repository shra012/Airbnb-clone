const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.post('/', (req, res) => {
  res.status(501).json({ success: false, message: 'Create booking endpoint not implemented yet' });
});

router.get('/', (req, res) => {
  res.status(501).json({ success: false, message: 'List bookings endpoint not implemented yet' });
});

router.post('/:bookingId/accept', (req, res) => {
  res.status(501).json({ success: false, message: 'Accept booking endpoint not implemented yet' });
});

router.post('/:bookingId/cancel', (req, res) => {
  res.status(501).json({ success: false, message: 'Cancel booking endpoint not implemented yet' });
});

module.exports = router;
