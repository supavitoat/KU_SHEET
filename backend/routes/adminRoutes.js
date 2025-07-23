const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPendingSheets,
  getSheetForReview,
  approveSheet,
  rejectSheet,
  getPendingOrders,
  getOrderForReview,
  verifyPayment,
  rejectPayment,
  getAllUsers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(protect, authorize('ADMIN'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', getDashboardStats);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', getAllUsers);

// Sheet management routes
// @route   GET /api/admin/sheets/pending
// @desc    Get pending sheets for approval
// @access  Private (Admin)
router.get('/sheets/pending', getPendingSheets);

// @route   GET /api/admin/sheets/:id
// @desc    Get sheet by ID for admin review
// @access  Private (Admin)
router.get('/sheets/:id', getSheetForReview);

// @route   PUT /api/admin/sheets/:id/approve
// @desc    Approve sheet
// @access  Private (Admin)
router.put('/sheets/:id/approve', approveSheet);

// @route   PUT /api/admin/sheets/:id/reject
// @desc    Reject sheet
// @access  Private (Admin)
router.put('/sheets/:id/reject', rejectSheet);

// Order management routes
// @route   GET /api/admin/orders/pending
// @desc    Get pending payment slips
// @access  Private (Admin)
router.get('/orders/pending', getPendingOrders);

// @route   GET /api/admin/orders/:id
// @desc    Get order by ID for admin review
// @access  Private (Admin)
router.get('/orders/:id', getOrderForReview);

// @route   PUT /api/admin/orders/:id/verify
// @desc    Verify payment
// @access  Private (Admin)
router.put('/orders/:id/verify', verifyPayment);

// @route   PUT /api/admin/orders/:id/reject
// @desc    Reject payment
// @access  Private (Admin)
router.put('/orders/:id/reject', rejectPayment);

module.exports = router;