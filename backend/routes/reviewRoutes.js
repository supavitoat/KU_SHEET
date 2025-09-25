const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/reviewController');

// Public: list reviews and average
router.get('/:sheetId', controller.getSheetReviews);

// Authenticated: my review CRUD
router.get('/:sheetId/me', protect, controller.getMyReview);
router.post('/:sheetId', protect, controller.createOrUpdateReview);
router.put('/:sheetId', protect, controller.createOrUpdateReview);
router.delete('/:sheetId', protect, controller.deleteMyReview);

module.exports = router;


