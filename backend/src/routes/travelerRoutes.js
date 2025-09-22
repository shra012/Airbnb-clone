const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth, requireRole('TRAVELER'));

router.get('/dashboard', (req, res) => {
  res.status(501).json({ success: false, message: 'Traveler dashboard endpoint not implemented yet' });
});

router.get('/bookings', (req, res) => {
  res.status(501).json({ success: false, message: 'Traveler bookings endpoint not implemented yet' });
});

router.get('/favorites', (req, res) => {
  res.status(501).json({ success: false, message: 'Traveler favorites endpoint not implemented yet' });
});

module.exports = router;
