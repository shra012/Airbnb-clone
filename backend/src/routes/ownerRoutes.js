const express = require('express');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const { validateBody } = require('../middleware/validateRequest');
const {
  ownerDashboard,
  ownerBookings,
  ownerCreateProperty,
  updateProfile,
  propertyCreateSchema,
  ownerProfileUpdateSchema,
} = require('../controllers/ownerController');

const router = express.Router();

router.use(requireAuth, requireRole('OWNER'));

router.get('/dashboard', ownerDashboard);
router.get('/bookings', ownerBookings);
router.post('/properties', validateBody(propertyCreateSchema), ownerCreateProperty);
router.put('/profile', validateBody(ownerProfileUpdateSchema), updateProfile);

module.exports = router;
