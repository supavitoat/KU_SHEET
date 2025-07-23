const { prisma } = require('../config/database');
const path = require('path');

// @desc    Register as seller
// @route   POST /api/seller/register
// @access  Private
const registerSeller = async (req, res) => {
  try {
    const { pen_name, real_name, phone, bank_name, bank_account, account_name } = req.body;

    // Check if user is already a seller
    const existingSeller = await prisma.seller.findFirst({ where: { userId: req.user.id } });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'User is already registered as a seller',
      });
    }

    // Check if pen name is already taken
    const existingPenName = await prisma.seller.findFirst({ where: { penName: pen_name } });
    if (existingPenName) {
      return res.status(400).json({
        success: false,
        message: 'Pen name is already taken',
      });
    }

    // Create seller profile
    const seller = await prisma.seller.create({
      data: {
        userId: req.user.id,
        penName: pen_name,
        realName: real_name,
        phone,
        bankName: bank_name,
        bankAccount: bank_account,
        accountName: account_name,
      },
    });

    // Update user is_seller flag
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isSeller: true },
    });

    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      data: seller,
    });
  } catch (error) {
    console.error('Register seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during seller registration',
      error: error.message,
    });
  }
};

// @desc    Get seller profile
// @route   GET /api/seller/profile
// @access  Private (Seller)
const getSellerProfile = async (req, res) => {
  try {
    const seller = await prisma.seller.findFirst({
      where: { userId: req.user.id },
      include: {
        user: { select: { email: true, fullName: true } },
      },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    res.json({
      success: true,
      data: seller,
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update seller profile
// @route   PUT /api/seller/profile
// @access  Private (Seller)
const updateSellerProfile = async (req, res) => {
  try {
    const { pen_name, real_name, phone, bank_name, bank_account, account_name } = req.body;

    const seller = await prisma.seller.findFirst({ where: { userId: req.user.id } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    // Check if pen name is taken by another seller
    if (pen_name !== seller.penName) {
      const existingPenName = await prisma.seller.findFirst({
        where: {
          penName: pen_name,
          NOT: { id: seller.id },
        },
      });
      if (existingPenName) {
        return res.status(400).json({
          success: false,
          message: 'Pen name is already taken',
        });
      }
    }

    // Update seller profile
    const updatedSeller = await prisma.seller.update({
      where: { id: seller.id },
      data: {
        penName: pen_name,
        realName: real_name,
        phone,
        bankName: bank_name,
        bankAccount: bank_account,
        accountName: account_name,
      },
    });

    res.json({
      success: true,
      message: 'Seller profile updated successfully',
      data: updatedSeller,
    });
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message,
    });
  }
};

// @desc    Create new sheet
// @route   POST /api/seller/sheets
// @access  Private (Seller)
const createSheet = async (req, res) => {
  try {
    const {
      title,
      subject_code,
      subject_name,
      section,
      class_time,
      short_description,
      long_description,
      type,
      term,
      year,
      price,
      faculty_id,
      subject_id,
      seller_message,
    } = req.body;

    // Get seller info
    const seller = await prisma.seller.findFirst({ where: { userId: req.user.id } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    // Handle file uploads
    const files = req.files;
    if (!files || !files.pdf_file || files.pdf_file.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
      });
    }

    const pdfFile = files.pdf_file[0].filename;
    const coverImage = files.cover_image ? files.cover_image[0].filename : null;
    const previewImages = files.preview_images ? files.preview_images.map(file => file.filename) : [];

    // Create sheet
    const sheet = await prisma.sheet.create({
      data: {
        sellerId: seller.id,
        facultyId: Number(faculty_id),
        subjectId: Number(subject_id),
        title,
        subjectCode: subject_code,
        subjectName: subject_name,
        section,
        classTime: class_time,
        shortDescription: short_description,
        longDescription: long_description,
        type,
        term,
        year: Number(year),
        price: parseFloat(price),
        coverImage: coverImage,
        previewImages: JSON.stringify(previewImages),
        pdfFile: pdfFile,
        sellerMessage: seller_message,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sheet created successfully and submitted for review',
      data: sheet,
    });
  } catch (error) {
    console.error('Create sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sheet creation',
      error: error.message,
    });
  }
};

// @desc    Get seller's sheets
// @route   GET /api/seller/sheets
// @access  Private (Seller)
const getSellerSheets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Get seller info
    const seller = await prisma.seller.findFirst({ where: { userId: req.user.id } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = { sellerId: seller.id };

    if (status) {
      whereClause.status = status;
    }

    const [count, rows] = await Promise.all([
      prisma.sheet.count({ where: whereClause }),
      prisma.sheet.findMany({
        where: whereClause,
        include: {
          faculty: { select: { name: true, code: true } },
          subject: { select: { name: true, code: true } },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        sheets: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get seller sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update sheet
// @route   PUT /api/seller/sheets/:id
// @access  Private (Seller)
const updateSheet = async (req, res) => {
  try {
    const { id } = req.params;

    // Get seller info
    const seller = await prisma.seller.findFirst({ where: { userId: req.user.id } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    // Find sheet
    const sheet = await prisma.sheet.findFirst({
      where: {
        id: Number(id),
        sellerId: seller.id,
      },
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found',
      });
    }

    // Only allow updates for pending or rejected sheets
    if (sheet.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved sheets',
      });
    }

    const {
      title,
      subject_code,
      subject_name,
      section,
      class_time,
      short_description,
      long_description,
      type,
      term,
      year,
      price,
      faculty_id,
      subject_id,
      seller_message,
    } = req.body;

    // Handle file uploads if provided
    const files = req.files;
    const updateData = {
      title,
      subjectCode: subject_code,
      subjectName: subject_name,
      section,
      classTime: class_time,
      shortDescription: short_description,
      longDescription: long_description,
      type,
      term,
      year: Number(year),
      price: parseFloat(price),
      facultyId: Number(faculty_id),
      subjectId: Number(subject_id),
      sellerMessage: seller_message,
      status: 'PENDING', // Reset to pending when updated
    };

    if (files && files.pdf_file && files.pdf_file.length > 0) {
      updateData.pdfFile = files.pdf_file[0].filename;
    }

    if (files && files.cover_image && files.cover_image.length > 0) {
      updateData.coverImage = files.cover_image[0].filename;
    }

    if (files && files.preview_images && files.preview_images.length > 0) {
      updateData.previewImages = JSON.stringify(files.preview_images.map(file => file.filename));
    }

    // Update sheet
    const updatedSheet = await prisma.sheet.update({
      where: { id: sheet.id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Sheet updated successfully',
      data: updatedSheet,
    });
  } catch (error) {
    console.error('Update sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sheet update',
      error: error.message,
    });
  }
};

// @desc    Get seller revenue history
// @route   GET /api/seller/revenue
// @access  Private (Seller)
const getSellerRevenue = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get seller info
    const seller = await prisma.seller.findFirst({ where: { userId: req.user.id } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    const offset = (page - 1) * limit;

    // Get verified orders (completed sales)
    const [count, rows, totalRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          sellerId: seller.id,
          status: 'verified',
        },
      }),
      prisma.order.findMany({
        where: {
          sellerId: seller.id,
          status: 'verified',
        },
        include: {
          sheet: { select: { title: true, subjectCode: true } },
          user: { select: { fullName: true, email: true } },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { verifiedDate: 'desc' },
      }),
      prisma.order.aggregate({
        _sum: { amount: true },
        where: {
          sellerId: seller.id,
          status: 'verified',
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        transactions: rows,
        total_revenue: totalRevenue._sum.amount || 0,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get seller revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete sheet
// @route   DELETE /api/seller/sheets/:id
// @access  Private (Seller)
const deleteSheet = async (req, res) => {
  try {
    const { id } = req.params;

    // Get seller info
    const seller = await prisma.seller.findFirst({ where: { userId: req.user.id } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    // Find sheet
    const sheet = await prisma.sheet.findFirst({
      where: {
        id: Number(id),
        sellerId: seller.id,
      },
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found',
      });
    }

    // Check if sheet has orders
    const hasOrders = await prisma.order.findFirst({
      where: { sheetId: sheet.id },
    });

    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sheet that has orders',
      });
    }

    // Delete sheet
    await prisma.sheet.delete({ where: { id: sheet.id } });

    res.json({
      success: true,
      message: 'Sheet deleted successfully',
    });
  } catch (error) {
    console.error('Delete sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sheet deletion',
      error: error.message,
    });
  }
};

module.exports = {
  registerSeller,
  getSellerProfile,
  updateSellerProfile,
  createSheet,
  getSellerSheets,
  updateSheet,
  getSellerRevenue,
  deleteSheet,
};