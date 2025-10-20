const express = require('express');
const authRoutes = require('./authRoutes');
const travelerRoutes = require('./travelerRoutes');
const ownerRoutes = require('./ownerRoutes');
const propertyRoutes = require('./propertyRoutes');
const bookingRoutes = require('./bookingRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const agentRoutes = require('./agentRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/traveler', travelerRoutes);
router.use('/owner', ownerRoutes);
router.use('/properties', propertyRoutes);
router.use('/bookings', bookingRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/agent', agentRoutes);

module.exports = router;
