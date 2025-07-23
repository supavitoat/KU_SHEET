const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  googleCallback,
  logout,
} = require('../controllers/authController');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
} = require('../middleware/validation');
const { protect } = require('../middleware/auth'); // เปลี่ยน authenticateToken เป็น protect

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', validateUserRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, login);

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', googleCallback);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe); // เปลี่ยน authenticateToken เป็น protect

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, validateUserProfile, updateProfile); // เปลี่ยน authenticateToken เป็น protect

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout); // เปลี่ยน authenticateToken เป็น protect

module.exports = router;