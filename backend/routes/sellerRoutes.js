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
  getSellerSheetById,
  getSellerNotifications,
} = require('../controllers/sellerController');
const {
  validateSellerRegistration,
  validateSheetCreation,
} = require('../middleware/validation');
const { protect, requireSeller } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { enforceFieldLimits } = require('../middleware/upload');

// สร้าง upload middleware สำหรับ sheet
const uploadSheet = upload.fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'preview_images', maxCount: 10 },
]);

// Error handling middleware สำหรับ upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        details: error.message,
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        details: error.message,
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  next(error);
};

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
  enforceFieldLimits({ pdf_file: 50*1024*1024, preview_images: 2*1024*1024 }),
  handleUploadError,
  validateSheetCreation,
  createSheet
);

// @route   GET /api/seller/sheets
// @desc    Get seller's sheets
// @access  Private (Seller)
router.get('/sheets', protect, requireSeller, getSellerSheets);

// @route   GET /api/seller/sheets/:id
// @desc    Get seller's sheet by ID
// @access  Private (Seller)
router.get('/sheets/:id', protect, requireSeller, getSellerSheetById);

// @route   PUT /api/seller/sheets/:id
// @desc    Update sheet
// @access  Private (Seller)
router.put(
  '/sheets/:id',
  protect,
  requireSeller,
  uploadSheet,
  enforceFieldLimits({ pdf_file: 50*1024*1024, preview_images: 2*1024*1024 }),
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

// @route   GET /api/seller/notifications
// @desc    Get seller notifications
// @access  Private (Seller)
router.get('/notifications', protect, requireSeller, getSellerNotifications);

module.exports = router;