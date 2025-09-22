const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth, requireRole('OWNER'));

router.get('/dashboard', (req, res) => {
  res.status(501).json({ success: false, message: 'Owner dashboard endpoint not implemented yet' });
});

router.get('/bookings', (req, res) => {
  res.status(501).json({ success: false, message: 'Owner booking management endpoint not implemented yet' });
});

router.post('/properties', (req, res) => {
  res.status(501).json({ success: false, message: 'Owner property creation endpoint not implemented yet' });
});

module.exports = router;
