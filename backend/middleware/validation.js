const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
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
  body('full_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('faculty')
    .notEmpty()
    .withMessage('Faculty is required'),
  body('major')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Major must be at least 2 characters long'),
  body('year')
    .isInt({ min: 1, max: 10 })
    .withMessage('Year must be a number between 1 and 10'),
  handleValidationErrors,
];

// Seller registration validation
const validateSellerRegistration = [
  body('pen_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Pen name must be between 2 and 50 characters'),
  body('real_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Real name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .isMobilePhone('th-TH')
    .withMessage('Please provide a valid Thai phone number'),
  body('bank_name')
    .trim()
    .notEmpty()
    .withMessage('Bank name is required'),
  body('bank_account')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Bank account must be between 10 and 20 characters'),
  body('account_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Account name must be between 2 and 100 characters'),
  handleValidationErrors,
];

// Sheet creation validation
const validateSheetCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('subject_code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be between 2 and 20 characters'),
  body('subject_name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Subject name must be between 2 and 200 characters'),
  body('short_description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Short description must be between 10 and 500 characters'),
  body('type')
    .isIn(['midterm', 'final', 'quiz', 'assignment', 'other'])
    .withMessage('Invalid sheet type'),
  body('term')
    .isIn(['term1', 'term2', 'summer'])
    .withMessage('Invalid term'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  body('price')
    .isFloat({ min: 0, max: 9999.99 })
    .withMessage('Price must be between 0 and 9999.99'),
  body('faculty_id')
    .isInt({ min: 1 })
    .withMessage('Valid faculty is required'),
  body('subject_id')
    .isInt({ min: 1 })
    .withMessage('Valid subject is required'),
  handleValidationErrors,
];

// Order validation
const validateOrder = [
  body('sheet_id')
    .isInt({ min: 1 })
    .withMessage('Valid sheet ID is required'),
  handleValidationErrors,
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
  validateSellerRegistration,
  validateSheetCreation,
  validateOrder,
  handleValidationErrors,
};