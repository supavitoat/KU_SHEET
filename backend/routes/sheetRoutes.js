const express = require('express');
const router = express.Router();
const {
  getSheets,
  getSheetById,
  getSheetsByFaculty,
  downloadSheet,
  getFeaturedSheets,
  searchSheets,
} = require('../controllers/sheetController');
const { protect, optionalAuth } = require('../middleware/auth');

// @route   GET /api/sheets
// @desc    Get all approved sheets with filters
// @access  Public
router.get('/', getSheets);

// @route   GET /api/sheets/featured
// @desc    Get featured/popular sheets
// @access  Public
router.get('/featured', getFeaturedSheets);

// @route   GET /api/sheets/search
// @desc    Search sheets
// @access  Public
router.get('/search', searchSheets);

// @route   GET /api/sheets/faculty/:facultyId
// @desc    Get sheets by faculty
// @access  Public
router.get('/faculty/:facultyId', getSheetsByFaculty);

// @route   GET /api/sheets/:id
// @desc    Get sheet by ID
// @access  Public (but includes purchase status if authenticated)
router.get('/:id', optionalAuth, getSheetById);

// @route   GET /api/sheets/:id/download
// @desc    Download sheet file
// @access  Private
router.get('/:id/download', protect, downloadSheet);

module.exports = router;