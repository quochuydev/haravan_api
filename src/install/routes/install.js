const express = require('express');
const router = express.Router();
const omniController = require('../controllers/omni');

router.get('/', omniController.get);
router.post('/grandservice', omniController.grandservice);

module.exports = router;