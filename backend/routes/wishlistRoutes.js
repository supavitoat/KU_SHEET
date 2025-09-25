const express = require('express');
const router = express.Router();
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  getWishlistIds
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// @route   POST /api/wishlist
// @desc    Add sheet to wishlist
// @access  Private
router.post('/', addToWishlist);

// @route   DELETE /api/wishlist/:sheetId
// @desc    Remove sheet from wishlist
// @access  Private
router.delete('/:sheetId', removeFromWishlist);

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', getWishlist);

// @route   GET /api/wishlist/check/:sheetId
// @desc    Check if sheet is in wishlist
// @access  Private
router.get('/check/:sheetId', checkWishlist);

// @route   GET /api/wishlist/ids
// @desc    Get user's wishlist IDs
// @access  Private
router.get('/ids', getWishlistIds);

module.exports = router; 