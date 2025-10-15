const { prisma } = require('../config/database');

// Helpers (pure data builders)
const buildFaculties = () => [
  { id: 1, name: 'คณะเกษตรศาสตร์', code: 'AGRI' },
  { id: 2, name: 'คณะวิศวกรรมศาสตร์', code: 'ENG' },
  { id: 3, name: 'คณะวิทยาศาสตร์', code: 'SCI' },
  { id: 4, name: 'คณะมนุษยศาสตร์', code: 'LA' },
  { id: 5, name: 'คณะสังคมศาสตร์', code: 'SOC' },
  { id: 6, name: 'คณะบริการศาสตร์', code: 'SERVICE' },
  { id: 7, name: 'คณะสัตวแพทยศาสตร์', code: 'VET' },
];

const buildSubjects = () => [
  { id: 1, name: 'ภาควิชาพืชไร่', facultyId: 1, code: 'AGRI001' },
  { id: 2, name: 'ภาควิชาพืชสวน', facultyId: 1, code: 'AGRI002' },
  { id: 3, name: 'ภาควิชาสัตวบาล', facultyId: 1, code: 'AGRI003' },
  { id: 4, name: 'ภาควิชาพืชโรคพืช', facultyId: 1, code: 'AGRI004' },
  { id: 5, name: 'ภาควิชาเกษตรกลวิธาน', facultyId: 1, code: 'AGRI005' },
  { id: 6, name: 'ภาควิชาเทคโนโลยีการเกษตร', facultyId: 1, code: 'AGRI006' },
  { id: 7, name: 'วิศวกรรมเครื่องกล', facultyId: 2, code: 'ENG001' },
  { id: 8, name: 'วิศวกรรมไฟฟ้า', facultyId: 2, code: 'ENG002' },
  { id: 9, name: 'วิศวกรรมอุตสาหการ', facultyId: 2, code: 'ENG003' },
  { id: 10, name: 'วิศวกรรมโยธา', facultyId: 2, code: 'ENG004' },
  { id: 11, name: 'วิศวกรรมคอมพิวเตอร์', facultyId: 2, code: 'ENG005' },
  { id: 12, name: 'วิศวกรรมเคมี', facultyId: 2, code: 'ENG006' },
  { id: 13, name: 'คณิตศาสตร์', facultyId: 3, code: 'SCI001' },
  { id: 14, name: 'ฟิสิกส์', facultyId: 3, code: 'SCI002' },
  { id: 15, name: 'เคมี', facultyId: 3, code: 'SCI003' },
  { id: 16, name: 'ชีววิทยา', facultyId: 3, code: 'SCI004' },
];

// @desc    Get all faculties
// @route   GET /api/metadata/faculties
// @access  Public
const getFaculties = async (req, res) => {
  try {
  // ข้อมูลคงที่เพื่อให้บริการรวดเร็ว
  const faculties = buildFaculties();
  res.json({ success: true, count: faculties.length, data: faculties });
  } catch (error) {
  console.error('[Metadata] getFaculties error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching faculties' });
  }
};

// @desc    Get subjects by faculty
// @route   GET /api/metadata/subjects
// @access  Public
const getSubjects = async (req, res) => {
  try {
    const { facultyId } = req.query;
    // ข้อมูลคงที่เพื่อให้บริการรวดเร็ว
    const allSubjects = buildSubjects();
    let subjects = allSubjects;
    if (facultyId) {
      const fid = parseInt(facultyId, 10);
      subjects = allSubjects.filter((s) => s.facultyId === fid);
    }
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    console.error('[Metadata] getSubjects error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching subjects' });
  }
};

// @desc    Search subjects by keyword
// @route   GET /api/metadata/subjects/search
// @access  Public
const searchSubjects = async (req, res) => {
  try {
    const { q, facultyId } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });

    const needle = q.trim().toLowerCase();
    // สร้างรายการวิชาและกรองตาม facultyId ถ้ามี
    const allSubjects = buildSubjects();
    const filteredByFaculty = facultyId
      ? allSubjects.filter((s) => s.facultyId === parseInt(facultyId, 10))
      : allSubjects;
    const subjects = filteredByFaculty.filter(
      (s) => s.code.toLowerCase().includes(needle) || s.name.toLowerCase().includes(needle)
    );

    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    console.error('[Metadata] searchSubjects error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while searching subjects' });
  }
};

// @desc    Get sheet types enum
// @route   GET /api/metadata/sheet-types
// @access  Public
const getSheetTypes = async (_req, res) => {
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
  res.json({ success: true, data: sheetTypes });
  } catch (error) {
  console.error('[Metadata] getSheetTypes error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching sheet types' });
  }
};

// @desc    Get terms enum
// @route   GET /api/metadata/terms
// @access  Public
const getTerms = async (_req, res) => {
  try {
    const terms = [
      { value: 'TERM1', label: 'Term 1' },
      { value: 'TERM2', label: 'Term 2' },
      { value: 'SUMMER', label: 'Summer' },
    ];
    res.json({ success: true, data: terms });
  } catch (error) {
    console.error('[Metadata] getTerms error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching terms' });
  }
};

// @desc    Get years for sheets
// @route   GET /api/metadata/years
// @access  Public
const getYears = async (_req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => ({
      value: currentYear - i,
      label: String(currentYear - i),
    }));
    res.json({ success: true, data: years });
  } catch (error) {
    console.error('[Metadata] getYears error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching years' });
  }
};

// @desc    Get Thai university faculties (static list)
// @route   GET /api/metadata/thai-faculties
// @access  Public
const getThaiFaculties = async (_req, res) => {
  try {
    const thaiFaculties = [
      { id: 1, name: 'คณะเกษตร', code: 'E01' },
      { id: 2, name: 'คณะประมง', code: 'E02' },
      { id: 3, name: 'คณะวนศาสตร์', code: 'E03' },
      { id: 4, name: 'คณะวิทยาศาสตร์', code: 'E04' },
      { id: 5, name: 'คณะวิศวกรรมศาสตร์', code: 'E05' },
      { id: 6, name: 'คณะสังคมศาสตร์', code: 'E06' }
    ];
  res.json({ success: true, count: thaiFaculties.length, data: thaiFaculties });
  } catch (error) {
  console.error('[Metadata] getThaiFaculties error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching Thai faculties' });
  }
};

// @desc    Get statistics for StatCards
// @route   GET /api/metadata/stats
// @access  Public
const getStats = async (_req, res) => {
  try {
    const totalDownloads = await prisma.order.count({ where: { status: 'VERIFIED' } });
    const totalSheets = await prisma.sheet.count({ where: { status: 'APPROVED' } });
    const totalUsers = await prisma.user.count();
    const ratingStats = await prisma.review.aggregate({ _avg: { rating: true }, _count: { rating: true } });
    const averageRating = ratingStats._avg.rating || 0;
  res.json({ success: true, data: { totalDownloads, averageRating, totalSheets, totalUsers } });
  } catch (error) {
  console.error('[Metadata] getStats error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching stats' });
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
  getStats
};