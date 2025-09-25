const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { submitReport, listReports, updateReport, getMyReport } = require('../controllers/reportController');

// User submit report
router.post('/reports', protect, submitReport);
router.get('/reports/me', protect, getMyReport);

// Admin manage reports
router.get('/admin/reports', protect, requireAdmin, listReports);
router.put('/admin/reports/:id', protect, requireAdmin, updateReport);

module.exports = router;


