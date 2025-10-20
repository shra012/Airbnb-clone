const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { proxyConciergeRequest } = require('../controllers/agentController');

const router = express.Router();

router.use(requireAuth);
router.post('/concierge', proxyConciergeRequest);

module.exports = router;
