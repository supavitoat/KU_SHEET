const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  googleCallback,
  logout,
  checkEmail
} = require('../controllers/authController');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
} = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/google', googleCallback);
router.post('/check-email', checkEmail);

// Private routes
router.get('/me', protect, getMe);
router.put('/profile', protect, validateUserProfile, updateProfile);
router.post('/logout', protect, logout);

module.exports = router;