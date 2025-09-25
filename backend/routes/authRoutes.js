const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  updateProfileName,
  updateProfilePicture,
  googleCallback,
  googleCredentialLogin,
  logout,
  checkEmail,
  googleRegister,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
  validateUserNameOnly,
} = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', validateUserRegistration, register);

router.post('/google', googleCallback);
router.post('/google/callback', googleCredentialLogin);
router.post('/google/register', googleRegister);

router.post('/login', validateUserLogin, login);
router.post('/logout', logout);
router.post('/check-email', checkEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, validateUserProfile, updateProfile);
router.put('/profile/name', protect, validateUserNameOnly, updateProfileName);
router.put('/profile-picture', protect, updateProfilePicture);

module.exports = router;