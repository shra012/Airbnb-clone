const express = require('express');
const {
  travelerSignup,
  ownerSignup,
  login,
  logout,
  currentUser,
} = require('../controllers/authController');

const router = express.Router();

router.post('/traveler/signup', travelerSignup);
router.post('/owner/signup', ownerSignup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', currentUser);

module.exports = router;
 