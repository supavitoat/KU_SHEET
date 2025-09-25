const express = require('express');
const router = express.Router();
const {
  getSheets,
  getSheetById,
  getSheetsByFaculty,
  downloadSheet,
  downloadFreeSheet,
  getFeaturedSheets,
  searchSheets,
  getMySheets,
  getSheetStats,
} = require('../controllers/sheetController');
const { protect, optionalAuth } = require('../middleware/auth');

// @route   GET /api/sheets
// @desc    Get all approved sheets with filters
// @access  Public
router.get('/', optionalAuth, getSheets);

// @route   GET /api/sheets/featured
// @desc    Get featured/popular sheets
// @access  Public
router.get('/featured', optionalAuth, getFeaturedSheets);

// @route   GET /api/sheets/search
// @desc    Search sheets
// @access  Public
router.get('/search', optionalAuth, searchSheets);

// @route   GET /api/sheets/faculty/:facultyId
// @desc    Get sheets by faculty
// @access  Public
router.get('/faculty/:facultyId', optionalAuth, getSheetsByFaculty);

// @route   GET /api/sheets/my-sheets
// @desc    Get user's purchased sheets
// @access  Private
router.get('/my-sheets', protect, getMySheets);

// @route   GET /api/sheets/purchased
// @desc    Get user's purchased sheets (alias)
// @access  Private
router.get('/purchased', protect, getMySheets);

// @route   GET /api/sheets/:id/stats
// @desc    Get sheet stats (rating, review count, download count)
// @access  Public
router.get('/:id/stats', getSheetStats);

// @route   GET /api/sheets/:id
// @desc    Get sheet by ID
// @access  Public (but includes purchase status if authenticated)
router.get('/:id', optionalAuth, getSheetById);

// @route   GET /api/sheets/:id/download
// @desc    Download sheet file
// @access  Private
router.get('/:id/download', protect, downloadSheet);

// @route   GET /api/sheets/:id/download-free
// @desc    Download free sheet file (no authentication required)
// @access  Public
router.get('/:id/download-free', downloadFreeSheet);

module.exports = router;