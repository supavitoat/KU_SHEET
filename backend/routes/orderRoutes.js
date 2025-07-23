const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  uploadPaymentSlip,
  cancelOrder,
  getOrderStats,
} = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validation');
const { protect } = require('../middleware/auth'); // เปลี่ยน authenticateToken เป็น protect
const { uploadPaymentSlip: uploadSlip, handleUploadError } = require('../middleware/upload');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, validateOrder, createOrder);

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
// @desc    Upload payment slip
// @access  Private
router.post(
  '/:id/payment-slip',
  protect,
  uploadSlip,
  handleUploadError,
  uploadPaymentSlip
);

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private
router.delete('/:id', protect, cancelOrder);

module.exports = router;