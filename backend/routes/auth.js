const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  googleCallback,
  logout
} = require('../controllers/authController');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const profileValidation = [
  body('fullName')
    .notEmpty()
    .trim()
    .withMessage('Full name is required'),
  body('faculty')
    .notEmpty()
    .trim()
    .withMessage('Faculty is required'),
  body('major')
    .notEmpty()
    .trim()
    .withMessage('Major is required'),
  body('year')
    .isInt({ min: 1, max: 6 })
    .withMessage('Year must be between 1 and 6')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, profileValidation, updateProfile);
router.post('/logout', protect, logout);

// Google OAuth routes (for future implementation)
router.get('/google/callback', googleCallback);

module.exports = router;