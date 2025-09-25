// Helper functions for handling Thai and English subject names

/**
 * Create JSON string for bilingual subject names
 * @param {string} thaiName - ชื่อวิชาภาษาไทย
 * @param {string} englishName - English subject name
 * @returns {string} JSON string
 */
const createSubjectNameJSON = (thaiName, englishName) => {
  return JSON.stringify({
    th: thaiName,
    en: englishName
  });
};

/**
 * Parse JSON string to get subject names object
 * @param {string} subjectNameJSON - JSON string from database
 * @returns {object} Object with th and en properties
 */
const parseSubjectNameJSON = (subjectNameJSON) => {
  try {
    return JSON.parse(subjectNameJSON);
  } catch (error) {
    // Fallback if not JSON format
    return {
      th: subjectNameJSON,
      en: subjectNameJSON
    };
  }
};

/**
 * Get subject name by language
 * @param {string} subjectNameJSON - JSON string from database
 * @param {string} language - Language code ('th' or 'en')
 * @returns {string} Subject name in specified language
 */
const getSubjectNameByLanguage = (subjectNameJSON, language = 'th') => {
  const parsed = parseSubjectNameJSON(subjectNameJSON);
  return parsed[language] || parsed.th || subjectNameJSON;
};

/**
 * Format sheet data for API response with bilingual subject names
 * @param {object} sheet - Sheet object from database
 * @returns {object} Formatted sheet object
 */
const formatSheetResponse = (sheet) => {
  // console.log('🔧 formatSheetResponse called with sheet:', sheet ? `ID ${sheet.id}` : 'null');
  
  if (!sheet) {
    // console.log('❌ formatSheetResponse: sheet is null');
    return null;
  }
  
  // ใช้ major แทน subjectName
  const subjectNames = parseSubjectNameJSON(sheet.subjectNameJSON || sheet.major);
  // console.log('🔧 Parsed subject names:', subjectNames);
  
  const formatted = {
    ...sheet,
    subjectName: {
      thai: subjectNames.th,
      english: subjectNames.en,
      // For backward compatibility
      display: subjectNames.th || subjectNames.en || (sheet.subjectNameJSON || sheet.major)
    }
  };
  
  // console.log('✅ formatSheetResponse returning formatted sheet');
  return formatted;
};

/**
 * Prepare sheet data for database insertion
 * @param {object} formData - Form data from frontend
 * @returns {object} Prepared data for database
 */
const prepareSheetData = (formData) => {
  return {
    ...formData,
    subjectName: createSubjectNameJSON(
      formData.subjectNameThai || formData.subjectName,
      formData.subjectNameEnglish || formData.subjectName
    )
  };
};

module.exports = {
  createSubjectNameJSON,
  parseSubjectNameJSON,
  getSubjectNameByLanguage,
  formatSheetResponse,
  prepareSheetData
}; 