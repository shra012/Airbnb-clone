const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth, requireRole('TRAVELER'));

router.get('/', (req, res) => {
  res.status(501).json({ success: false, message: 'List favorites endpoint not implemented yet' });
});

router.post('/:propertyId', (req, res) => {
  res.status(501).json({ success: false, message: 'Add favorite endpoint not implemented yet' });
});

router.delete('/:propertyId', (req, res) => {
  res.status(501).json({ success: false, message: 'Remove favorite endpoint not implemented yet' });
});

module.exports = router;
