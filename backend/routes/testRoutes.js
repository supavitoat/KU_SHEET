const express = require('express');
const router = express.Router();
const { resetRateLimitForIp, resetTestData, resetAll } = require('../controllers/testController');

// Dev-only endpoints to help automated test runs
router.post('/reset-rate-limit', resetRateLimitForIp);
router.post('/reset-data', resetTestData);
router.post('/reset-all', resetAll);

module.exports = router;
