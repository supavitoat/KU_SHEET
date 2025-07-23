const express = require('express');
const {
  getFaculties,
  getSubjectsByFaculty,
  searchSubjects,
  getSheetTypes,
  getTerms,
  getYears,
  getStats
} = require('../controllers/metadataController');

const router = express.Router();

// Public routes
router.get('/faculties', getFaculties);
router.get('/subjects/:facultyId', getSubjectsByFaculty);
router.get('/subjects/search', searchSubjects);
router.get('/sheet-types', getSheetTypes);
router.get('/terms', getTerms);
router.get('/years', getYears);
router.get('/stats', getStats);

module.exports = router;