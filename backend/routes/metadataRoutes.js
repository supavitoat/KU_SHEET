const express = require('express');
const router = express.Router();
const {
  getFaculties,
  getSubjects,
  getSheetTypes,
  getTerms,
  getYears,
  searchSubjects,
  getThaiFaculties,
  getAllMetadata,
} = require('../controllers/metadataController');

// @route   GET /api/metadata/all
// @desc    Get all metadata in one call
// @access  Public
router.get('/all', getAllMetadata);

// @route   GET /api/metadata/faculties
// @desc    Get all faculties
// @access  Public
router.get('/faculties', getFaculties);

// @route   GET /api/metadata/thai-faculties
// @desc    Get Thai university faculties (mock data)
// @access  Public
router.get('/thai-faculties', getThaiFaculties);

// @route   GET /api/metadata/subjects
// @desc    Get subjects by faculty or search
// @access  Public
router.get('/subjects', getSubjects);

// @route   GET /api/metadata/subjects/search
// @desc    Search subjects by keyword
// @access  Public
router.get('/subjects/search', searchSubjects);

// @route   GET /api/metadata/sheet-types
// @desc    Get sheet types enum
// @access  Public
router.get('/sheet-types', getSheetTypes);

// @route   GET /api/metadata/terms
// @desc    Get terms enum
// @access  Public
router.get('/terms', getTerms);

// @route   GET /api/metadata/years
// @desc    Get years enum
// @access  Public
router.get('/years', getYears);

module.exports = router;