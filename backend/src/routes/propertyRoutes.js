const express = require('express');
const { validateQuery } = require('../middleware/validateRequest');
const {
  propertySearchSchema,
  listProperties,
  getProperty,
  listPropertyNotificationsHandler,
} = require('../controllers/propertyController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', validateQuery(propertySearchSchema), listProperties);
router.get('/:propertyId', getProperty);
router.get('/:propertyId/notifications', requireAuth, listPropertyNotificationsHandler);

module.exports = router;
