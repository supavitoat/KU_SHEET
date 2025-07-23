const express = require('express');
const router = express.Router();
const {
  registerSeller,
  getSellerProfile,
  updateSellerProfile,
  createSheet,
  getSellerSheets,
  updateSheet,
  getSellerRevenue,
  deleteSheet,
} = require('../controllers/sellerController');
const {
  validateSellerRegistration,
  validateSheetCreation,
} = require('../middleware/validation');
const { protect, requireSeller } = require('../middleware/auth');
const { uploadSheet, handleUploadError } = require('../middleware/upload');

// @route   POST /api/seller/register
// @desc    Register as seller
// @access  Private
router.post('/register', protect, validateSellerRegistration, registerSeller);

// @route   GET /api/seller/profile
// @desc    Get seller profile
// @access  Private (Seller)
router.get('/profile', protect, requireSeller, getSellerProfile);

// @route   PUT /api/seller/profile
// @desc    Update seller profile
// @access  Private (Seller)
router.put('/profile', protect, requireSeller, validateSellerRegistration, updateSellerProfile);

// @route   POST /api/seller/sheets
// @desc    Create new sheet
// @access  Private (Seller)
router.post(
  '/sheets',
  protect,
  requireSeller,
  uploadSheet,
  handleUploadError,
  validateSheetCreation,
  createSheet
);

// @route   GET /api/seller/sheets
// @desc    Get seller's sheets
// @access  Private (Seller)
router.get('/sheets', protect, requireSeller, getSellerSheets);

// @route   PUT /api/seller/sheets/:id
// @desc    Update sheet
// @access  Private (Seller)
router.put(
  '/sheets/:id',
  protect,
  requireSeller,
  uploadSheet,
  handleUploadError,
  validateSheetCreation,
  updateSheet
);

// @route   DELETE /api/seller/sheets/:id
// @desc    Delete sheet
// @access  Private (Seller)
router.delete('/sheets/:id', protect, requireSeller, deleteSheet);

// @route   GET /api/seller/revenue
// @desc    Get seller revenue history
// @access  Private (Seller)
router.get('/revenue', protect, requireSeller, getSellerRevenue);

module.exports = router;