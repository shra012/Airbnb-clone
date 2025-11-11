const express = require('express');
const { listNotificationsHandler, markNotificationReadHandler } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);
router.get('/', listNotificationsHandler);
router.post('/:id/read', markNotificationReadHandler);

module.exports = router;
