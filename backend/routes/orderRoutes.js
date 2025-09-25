const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  uploadPaymentSlip,
  cancelOrder,
  getOrderStats,
  getUserPurchasedSheets,
} = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validation');
const { protect } = require('../middleware/auth'); // เปลี่ยน authenticateToken เป็น protect
const upload = require('../middleware/upload');

// สร้าง upload middleware สำหรับ payment slip (ขนาดไม่เกิน 5MB)
const uploadSlip = upload.single('payment_slip');
const enforceSlipMax5MB = (req, res, next) => {
  const file = req.file;
  if (file && file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'File too large (>5MB)' });
  }
  next();
};

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

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, validateOrder, createOrder);

// @route   GET /api/orders/purchased-sheets
// @desc    Get user's purchased sheets (verified orders)
// @access  Private
router.get('/purchased-sheets', protect, getUserPurchasedSheets);

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', protect, getUserOrders);

// @route   GET /api/orders/stats
// @desc    Get order statistics for user
// @access  Private
router.get('/stats', protect, getOrderStats);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, getOrderById);

// @route   POST /api/orders/:id/payment-slip
// @desc    Upload payment slip (old method)
// @access  Private
router.post(
  '/:id/payment-slip',
  protect,
  uploadSlip,
  enforceSlipMax5MB,
  handleUploadError,
  uploadPaymentSlip
);

// @route   POST /api/orders/:id/slip-verify
// @desc    Upload slip with auto verification
// @access  Private
const { uploadAndVerifySlip, retrySlipVerification } = require('../controllers/slipController');
router.post(
  '/:id/slip-verify',
  protect,
  uploadSlip,
  enforceSlipMax5MB,
  handleUploadError,
  uploadAndVerifySlip
);

// @route   POST /api/orders/:id/slip-retry
// @desc    Retry slip verification
// @access  Private
router.post(
  '/:id/slip-retry',
  protect,
  retrySlipVerification
);

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private
router.delete('/:id', protect, cancelOrder);

module.exports = router;