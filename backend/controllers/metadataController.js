const { prisma } = require('../config/database');

// @desc    Get all faculties
// @route   GET /api/metadata/faculties
// @access  Public
const getFaculties = async (req, res) => {
  try {
    const faculties = await prisma.faculty.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { subjects: true } }
      }
    });

    res.json({
      success: true,
      count: faculties.length,
      data: faculties
    });
  } catch (error) {
    console.error('Get faculties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching faculties'
    });
  }
};

// @desc    Get subjects by faculty
// @route   GET /api/metadata/subjects
// @access  Public
const getSubjects = async (req, res) => {
  try {
    const { facultyId } = req.query;

    const whereClause = {};
    if (facultyId) {
      whereClause.facultyId = parseInt(facultyId);
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { code: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects'
    });
  }
};

// @desc    Search subjects by keyword
// @route   GET /api/metadata/subjects/search
// @access  Public
const searchSubjects = async (req, res) => {
  try {
    const { q, facultyId } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const whereClause = {
      OR: [
        { code: { contains: q.trim() } },
        { name: { contains: q.trim() } }
      ]
    };

    if (facultyId) {
      whereClause.facultyId = parseInt(facultyId);
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { code: 'asc' },
        { name: 'asc' }
      ],
      take: 50 // Limit results
    });

    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error('Search subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching subjects'
    });
  }
};

// @desc    Get sheet types enum
// @route   GET /api/metadata/sheet-types
// @access  Public
const getSheetTypes = async (req, res) => {
  try {
    const sheetTypes = [
      { value: 'MIDTERM', label: 'Midterm Exam' },
      { value: 'FINAL', label: 'Final Exam' },
      { value: 'QUIZ', label: 'Quiz' },
      { value: 'ASSIGNMENT', label: 'Assignment' },
      { value: 'NOTE', label: 'Class Notes' },
      { value: 'EXERCISE', label: 'Exercise' },
      { value: 'SUMMARY', label: 'Summary' },
      { value: 'OTHER', label: 'Other' }
    ];

    res.json({
      success: true,
      data: sheetTypes
    });
  } catch (error) {
    console.error('Get sheet types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sheet types'
    });
  }
};

// @desc    Get terms enum
// @route   GET /api/metadata/terms
// @access  Public
const getTerms = async (req, res) => {
  try {
    const terms = [
      { value: 'TERM1', label: 'Term 1' },
      { value: 'TERM2', label: 'Term 2' },
      { value: 'SUMMER', label: 'Summer' }
    ];

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching terms'
    });
  }
};

// @desc    Get years for sheets
// @route   GET /api/metadata/years
// @access  Public
const getYears = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Generate years from current year back to 5 years
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push({ value: i, label: `${i}` });
    }

    res.json({
      success: true,
      data: years
    });
  } catch (error) {
    console.error('Get years error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching years'
    });
  }
};

// @desc    Get Thai university faculties (mock data)
// @route   GET /api/metadata/thai-faculties
// @access  Public
const getThaiFaculties = async (req, res) => {
  try {
    const thaiFaculties = [
      { id: 1, name: 'คณะเกษตร', code: 'E01' },
      { id: 2, name: 'คณะประมง', code: 'E02' },
      { id: 3, name: 'คณะวนศาสตร์', code: 'E03' },
      { id: 4, name: 'คณะวิทยาศาสตร์', code: 'E04' },
      { id: 5, name: 'คณะวิศวกรรมศาสตร์', code: 'E05' },
      { id: 6, name: 'คณะศึกษาศาสตร์', code: 'E06' },
      { id: 7, name: 'คณะเศรษฐศาสตร์', code: 'E07' },
      { id: 8, name: 'คณะสังคมศาสตร์', code: 'E08' },
      { id: 9, name: 'คณะสัตวแพทยศาสตร์', code: 'E09' },
      { id: 10, name: 'คณะอุตสาหกรรมเกษตร', code: 'E10' },
      { id: 11, name: 'คณะมนุษยศาสตร์', code: 'E11' },
      { id: 12, name: 'คณะบริหารธุรกิจ', code: 'E12' },
      { id: 13, name: 'คณะเทคนิคการสัตวแพทย์', code: 'E13' },
      { id: 14, name: 'วิทยาลัยการชลประทาน', code: 'E14' },
      { id: 15, name: 'คณะสิ่งแวดล้อม', code: 'E15' },
      { id: 16, name: 'คณะสถาปัตยกรรมศาสตร์', code: 'E16' },
    ];

    res.json({
      success: true,
      count: thaiFaculties.length,
      data: thaiFaculties
    });
  } catch (error) {
    console.error('Get Thai faculties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching Thai faculties'
    });
  }
};

// @desc    Get all metadata in one call
// @route   GET /api/metadata/all
// @access  Public
const getAllMetadata = async (req, res) => {
  try {
    const [faculties, subjects, sheetTypes, terms, years] = await Promise.all([
      prisma.faculty.findMany({ orderBy: { name: 'asc' } }),
      prisma.subject.findMany({
        include: { faculty: { select: { name: true, code: true } } },
        orderBy: [{ code: 'asc' }, { name: 'asc' }]
      }),
      getSheetTypes(req, { json: (data) => data }),
      getTerms(req, { json: (data) => data }),
      getYears(req, { json: (data) => data })
    ]);

    res.json({
      success: true,
      data: {
        faculties,
        subjects,
        sheetTypes: sheetTypes.data,
        terms: terms.data,
        years: years.data
      }
    });
  } catch (error) {
    console.error('Get all metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching all metadata'
    });
  }
};

module.exports = {
  getFaculties,
  getSubjects,
  searchSubjects,
  getSheetTypes,
  getTerms,
  getYears,
  getThaiFaculties,
  getAllMetadata
};