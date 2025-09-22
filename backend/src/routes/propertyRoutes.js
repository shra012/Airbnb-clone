const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ success: false, message: 'Property search endpoint not implemented yet' });
});

router.get('/:propertyId', (req, res) => {
  res.status(501).json({ success: false, message: 'Property detail endpoint not implemented yet' });
});

module.exports = router;
