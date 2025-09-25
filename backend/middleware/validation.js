const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation failed:', errors.array());
    console.error('📥 Request body for validation:', req.body);
    
    // แปลง error message ให้เหมาะสม
    let errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
    
    // ตรวจสอบ error type และแปลงข้อความ
    const emailError = errors.array().find(err => err.path === 'email');
    if (emailError) {
      if (emailError.msg === 'Please provide a valid email') {
        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (emailError.msg.includes('required')) {
        errorMessage = 'กรุณากรอกอีเมล';
      }
    }
    
    const passwordError = errors.array().find(err => err.path === 'password');
    if (passwordError) {
      if (passwordError.msg.includes('required')) {
        errorMessage = 'กรุณากรอกรหัสผ่าน';
      } else if (passwordError.msg.includes('min')) {
        errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      }
    }
    
    const fullNameError = errors.array().find(err => err.path === 'fullName');
    if (fullNameError) {
      if (fullNameError.msg.includes('required')) {
        errorMessage = 'กรุณากรอกชื่อ-นามสกุล';
      }
    }
    
    const facultyError = errors.array().find(err => err.path === 'faculty');
    if (facultyError) {
      if (facultyError.msg.includes('required')) {
        errorMessage = 'กรุณาเลือกคณะ';
      }
    }
    
    const majorError = errors.array().find(err => err.path === 'major');
    if (majorError) {
      if (majorError.msg.includes('required')) {
        errorMessage = 'กรุณาเลือกสาขา';
      }
    }
    
    const yearError = errors.array().find(err => err.path === 'year');
    if (yearError) {
      if (yearError.msg.includes('required')) {
        errorMessage = 'กรุณาเลือกชั้นปี';
      }
    }
    
    return res.status(400).json({
      success: false,
      message: errorMessage,
      errors: errors.array(),
    });
  }
  // console.log('✅ Validation passed for:', req.path);
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('กรุณากรอกอีเมลให้ถูกต้อง'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
    .withMessage('รหัสผ่านต้องประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข'),
  body('fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('ชื่อ-นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร'),
  body('faculty')
    .notEmpty()
    .withMessage('กรุณาเลือกคณะ'),
  body('major')
    .optional({ nullable: true })
    .trim(),
  body('year')
    .isInt({ min: 1, max: 10 })
    .withMessage('ชั้นปีต้องเป็นตัวเลขระหว่าง 1 ถึง 10'),
  handleValidationErrors,
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// User profile validation
const validateUserProfile = [
  body('fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('faculty')
    .notEmpty()
    .withMessage('Faculty is required'),
  body('major')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2 })
    .withMessage('Major must be at least 2 characters long'),
  body('year')
    .isInt({ min: 1, max: 10 })
    .withMessage('Year must be a number between 1 and 10'),
  handleValidationErrors,
];

// User name only validation
const validateUserNameOnly = [
  body('fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  handleValidationErrors,
];

// Seller registration validation
const validateSellerRegistration = [
  body('pen_name')
    .trim()
    .notEmpty()
    .withMessage('Pen name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Pen name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\u0E00-\u0E7F\s]+$/)
    .withMessage('Pen name can only contain Thai, English letters, numbers, and spaces'),
  body('phone')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value.trim() === '') {
        return true; // Allow empty phone
      }
      // ตรวจสอบรูปแบบเบอร์โทรไทย (รองรับเบอร์โทรที่ขึ้นต้นด้วย 02-09)
      const phoneRegex = /^0[2-9]\d{7,8}$/;
      if (!phoneRegex.test(value.replace(/[-\s]/g, ''))) {
        throw new Error('กรุณากรอกเบอร์โทรให้ถูกต้อง');
      }
      return true;
    }),
  body('bank_name')
    .optional({ nullable: true }),
  body('bank_account')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value.trim() === '') {
        return true; // Allow empty bank account
      }
      // ตรวจสอบว่าเป็นตัวเลขเท่านั้น และมีความยาวที่เหมาะสม
      const accountRegex = /^\d{10,12}$/;
      if (!accountRegex.test(value.replace(/[-\s]/g, ''))) {
        throw new Error('เลขบัญชีต้องเป็นตัวเลข 10-12 หลัก');
      }
      return true;
    }),
  body('account_name')
    .optional({ nullable: true }),
  body('prompt_pay_id')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value.trim() === '') {
        return true; // Allow empty prompt pay id
      }
      // ตรวจสอบรูปแบบ PromptPay ID (เบอร์โทร, เลขบัตรประชาชน, เลขบัญชี)
      // เบอร์โทร: 0xxxxxxxxx
      // เลขบัตรประชาชน: 13 หลัก
      // เลขบัญชี: 10-12 หลัก
      const phoneRegex = /^0[2-9]\d{7,8}$/;
      const idCardRegex = /^\d{13}$/;
      const accountRegex = /^\d{10,12}$/;
      
      const cleanValue = value.replace(/[-\s]/g, '');
      
      if (!phoneRegex.test(cleanValue) && !idCardRegex.test(cleanValue) && !accountRegex.test(cleanValue)) {
        throw new Error('PromptPay ID ต้องเป็นเบอร์โทร, เลขบัตรประชาชน, หรือเลขบัญชีที่ถูกต้อง');
      }
      return true;
    }),
  handleValidationErrors,
];

// Sheet creation validation
const validateSheetCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('subjectCode')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be between 2 and 20 characters'),
  body('description')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Description must be between 3 and 500 characters'),
  body('semester')
    .isIn(['เทอมต้น', 'เทอมปลาย', 'ซัมเมอร์'])
    .withMessage('Invalid semester'),
  body('academicYear')
    .custom((value) => {
      const num = parseInt(value);
      if (isNaN(num)) return false;
      
      // รองรับทั้งปีพุทธศักราช (2560-2568) และปีคริสต์ศักราช (2017-2025)
      const isValidBuddhistYear = num >= 2560 && num <= 2570; // เพิ่มช่วงปี
      const isValidChristianYear = num >= 2017 && num <= 2027; // เพิ่มช่วงปี
      
      return isValidBuddhistYear || isValidChristianYear;
    })
    .withMessage('Academic year must be between 2560-2570 (Buddhist Era) or 2017-2027 (Christian Era)'),
  body('price')
    .custom((value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0 && num <= 9999 && num % 1 === 0;
    })
    .withMessage('Price must be a whole number between 0 and 9999'),
  body('faculty')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Valid faculty is required'),
  body('major')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Valid major is required'),
  handleValidationErrors,
];

// Order validation
const validateOrder = [
  body()
    .custom((value, { req }) => {
      // ตรวจสอบว่ามี sheet_id หรือ items array
      if (!value.sheet_id && (!value.items || !Array.isArray(value.items) || value.items.length === 0)) {
        throw new Error('Either sheet_id or items array is required');
      }
      
      // ถ้ามี items array ให้ตรวจสอบแต่ละ item
      if (value.items && Array.isArray(value.items)) {
        for (let i = 0; i < value.items.length; i++) {
          const item = value.items[i];
          if (!item.sheetId || !Number.isInteger(Number(item.sheetId)) || Number(item.sheetId) < 1) {
            throw new Error(`Item ${i + 1}: Valid sheetId is required`);
          }
          if (item.quantity !== undefined && (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
            throw new Error(`Item ${i + 1}: Quantity must be a positive integer`);
          }
          if (item.price !== undefined && (isNaN(Number(item.price)) || Number(item.price) < 0)) {
            throw new Error(`Item ${i + 1}: Price must be a non-negative number`);
          }
        }
      }
      
      // ถ้ามี sheet_id ให้ตรวจสอบว่าเป็นตัวเลขที่ถูกต้อง
      if (value.sheet_id && (!Number.isInteger(Number(value.sheet_id)) || Number(value.sheet_id) < 1)) {
        throw new Error('Valid sheet_id is required');
      }
      
      return true;
    })
    .withMessage('Invalid order data'),
  handleValidationErrors,
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
  validateUserNameOnly,
  validateSellerRegistration,
  validateSheetCreation,
  validateOrder,
  handleValidationErrors,
};