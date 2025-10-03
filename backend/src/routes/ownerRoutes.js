const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const { validateBody } = require('../middleware/validateRequest');
const {
  ownerDashboard,
  ownerBookings,
  ownerCreateProperty,
  propertyCreateSchema,
} = require('../controllers/ownerController');

const router = express.Router();

router.use(requireAuth, requireRole('OWNER'));

router.get('/dashboard', ownerDashboard);
router.get('/bookings', ownerBookings);
router.post('/properties', validateBody(propertyCreateSchema), ownerCreateProperty);

module.exports = router;
