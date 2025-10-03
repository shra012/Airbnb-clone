const express = require('express');
const { validateQuery } = require('../middleware/validateRequest');
const { propertySearchSchema, listProperties, getProperty } = require('../controllers/propertyController');

const router = express.Router();

router.get('/', validateQuery(propertySearchSchema), listProperties);
router.get('/:propertyId', getProperty);

module.exports = router;
