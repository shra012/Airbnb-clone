const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { proxyConciergeRequest, proxyAgentChat } = require('../controllers/agentController');

const router = express.Router();

router.use(requireAuth);
router.post('/concierge', proxyConciergeRequest);
router.post('/chat', proxyAgentChat);

module.exports = router;
