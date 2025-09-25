const { prisma } = require('../config/database');



// @desc    Add sheet to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const { sheetId } = req.body;
    const userId = req.user.id;



    // Check if sheet exists
    const sheet = await prisma.sheet.findUnique({
      where: { id: parseInt(sheetId) }
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชีทที่ต้องการ'
      });
    }

    // Check if already in wishlist using Prisma model
    const existingWishlist = await prisma.wishlist.findFirst({
      where: {
        userId: userId,
        sheetId: parseInt(sheetId)
      }
    });

    if (existingWishlist) {
      return res.status(400).json({
        success: false,
        message: 'ชีทนี้อยู่ในรายการโปรดแล้ว'
      });
    }

    // Add to wishlist using Prisma model
    await prisma.wishlist.create({
      data: {
        userId: userId,
        sheetId: parseInt(sheetId)
      }
    });

    res.status(201).json({
      success: true,
      message: 'เพิ่มลงรายการโปรดสำเร็จ',
      data: { sheetId: parseInt(sheetId) }
    });

  } catch (error) {
    console.error('[Wishlist] Add to wishlist error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มรายการโปรด'
    });
  }
};

// @desc    Remove sheet from wishlist
// @route   DELETE /api/wishlist/:sheetId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const userId = req.user.id;



    // Check if exists in wishlist using Prisma model
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        userId: userId,
        sheetId: parseInt(sheetId)
      }
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชีทในรายการโปรด'
      });
    }

    // Remove from wishlist using Prisma model
    await prisma.wishlist.delete({
      where: {
        id: wishlist.id
      }
    });

    res.json({
      success: true,
      message: 'ลบออกจากรายการโปรดสำเร็จ'
    });

  } catch (error) {
    console.error('[Wishlist] Remove from wishlist error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบรายการโปรด'
    });
  }
};

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;



    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
      // Get wishlist using Prisma model
      const wishlistItems = await prisma.wishlist.findMany({
        where: { userId: userId },
        include: {
          sheet: {
            include: {
              seller: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      picture: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit)
      });

      // Get total count
      const total = await prisma.wishlist.count({
        where: { userId: userId }
      });

      // If no wishlist items, return empty
      if (wishlistItems.length === 0) {
        return res.json({
          success: true,
          data: {
            wishlist: [],
            pagination: {
              current_page: parseInt(page),
              total_pages: 0,
              total_items: 0,
              items_per_page: parseInt(limit)
            }
          }
        });
      }

      // Transform data to match expected format
      const wishlist = wishlistItems.map(item => ({
        ...item.sheet,
        seller_name: item.sheet.seller?.user?.fullName || 'Unknown',
        faculty_name: item.sheet.faculty?.name || 'Unknown',
        subject_name: item.sheet.subject?.name || 'Unknown'
      }));

      res.json({
        success: true,
        data: {
          wishlist: wishlist,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / parseInt(limit)),
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (dbError) {
      console.error('[Wishlist] Database error in getWishlist', { message: dbError.message, stack: dbError.stack });
      // Return empty wishlist if database error
      return res.json({
        success: true,
        data: {
          wishlist: [],
          pagination: {
            current_page: parseInt(page),
            total_pages: 0,
            total_items: 0,
            items_per_page: parseInt(limit)
          }
        }
      });
    }

  } catch (error) {
    console.error('[Wishlist] Get wishlist error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายการโปรด'
    });
  }
};

// @desc    Check if sheet is in wishlist
// @route   GET /api/wishlist/check/:sheetId
// @access  Private
const checkWishlist = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const userId = req.user.id;

    const wishlist = await prisma.wishlist.findFirst({
      where: {
        userId: userId,
        sheetId: parseInt(sheetId)
      }
    });

    res.json({
      success: true,
      data: {
        isInWishlist: !!wishlist
      }
    });

  } catch (error) {
    console.error('[Wishlist] Check wishlist error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบรายการโปรด'
    });
  }
};

// @desc    Get user's wishlist IDs (for frontend state)
// @route   GET /api/wishlist/ids
// @access  Private
const getWishlistIds = async (req, res) => {
  try {
    const userId = req.user.id;

    try {
      const wishlist = await prisma.wishlist.findMany({
        where: { userId: userId },
        select: { sheetId: true }
      });

      const wishlistIds = wishlist.map(item => item.sheetId);

      res.json({
        success: true,
        data: {
          wishlistIds: wishlistIds
        }
      });
    } catch (dbError) {
      console.error('[Wishlist] Database error in getWishlistIds', { message: dbError.message, stack: dbError.stack });
      // Return empty array if database error
      return res.json({
        success: true,
        data: {
          wishlistIds: []
        }
      });
    }

  } catch (error) {
    console.error('[Wishlist] Get wishlist IDs error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายการโปรด'
    });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  getWishlistIds
};