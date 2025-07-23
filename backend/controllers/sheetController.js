const { prisma } = require('../config/database');
const path = require('path');
const fs = require('fs');

// @desc    Get all approved sheets with filters
// @route   GET /api/sheets
// @access  Public
const getSheets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      faculty,
      term,
      year,
      type,
      search,
      sort = 'created_at',
      order = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'approved' };

    // Apply filters
    if (faculty) whereClause.facultyId = Number(faculty);
    if (term) whereClause.term = term;
    if (year) whereClause.year = Number(year);
    if (type) whereClause.type = type;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subjectCode: { contains: search, mode: 'insensitive' } },
        { subjectName: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [count, rows] = await Promise.all([
      prisma.sheet.count({ where: whereClause }),
      prisma.sheet.findMany({
        where: whereClause,
        include: {
          seller: {
            select: {
              penName: true,
              user: { select: { fullName: true } },
            },
          },
          faculty: { select: { name: true, code: true } },
          subject: { select: { name: true, code: true } },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { [sort]: order.toLowerCase() === 'desc' ? 'desc' : 'asc' },
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
    console.error('Get sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get sheet by ID
// @route   GET /api/sheets/:id
// @access  Public
const getSheetById = async (req, res) => {
  try {
    const sheet = await prisma.sheet.findFirst({
      where: {
        id: Number(req.params.id),
        status: 'approved',
      },
      include: {
        seller: {
          select: {
            penName: true,
            bankName: true,
            bankAccount: true,
            accountName: true,
            user: { select: { fullName: true } },
          },
        },
        faculty: { select: { name: true, code: true } },
        subject: { select: { name: true, code: true } },
      },
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found',
      });
    }

    // Check if user has already purchased this sheet
    let hasPurchased = false;
    if (req.user) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: req.user.id,
          sheetId: sheet.id,
          status: 'verified',
        },
      });
      hasPurchased = !!existingOrder;
    }

    res.json({
      success: true,
      data: {
        sheet,
        hasPurchased,
      },
    });
  } catch (error) {
    console.error('Get sheet by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get sheets by faculty
// @route   GET /api/sheets/faculty/:facultyId
// @access  Public
const getSheetsByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const {
      page = 1,
      limit = 12,
      term,
      year,
      type,
      search,
      sort = 'created_at',
      order = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      status: 'approved',
      facultyId: Number(facultyId),
    };

    // Apply additional filters
    if (term) whereClause.term = term;
    if (year) whereClause.year = Number(year);
    if (type) whereClause.type = type;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subjectCode: { contains: search, mode: 'insensitive' } },
        { subjectName: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [count, rows] = await Promise.all([
      prisma.sheet.count({ where: whereClause }),
      prisma.sheet.findMany({
        where: whereClause,
        include: {
          seller: {
            select: {
              penName: true,
              user: { select: { fullName: true } },
            },
          },
          faculty: { select: { name: true, code: true } },
          subject: { select: { name: true, code: true } },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { [sort]: order.toLowerCase() === 'desc' ? 'desc' : 'asc' },
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
    console.error('Get sheets by faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Download sheet file
// @route   GET /api/sheets/:id/download
// @access  Private
const downloadSheet = async (req, res) => {
  try {
    const sheet = await prisma.sheet.findFirst({
      where: {
        id: Number(req.params.id),
        status: 'approved',
      },
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found',
      });
    }

    // Check if sheet is free or user has purchased it
    if (!sheet.isFree) {
      const order = await prisma.order.findFirst({
        where: {
          userId: req.user.id,
          sheetId: sheet.id,
          status: 'verified',
        },
      });

      if (!order) {
        return res.status(403).json({
          success: false,
          message: 'You need to purchase this sheet first',
        });
      }
    }

    // Increment download count
    await prisma.sheet.update({
      where: { id: sheet.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Send file
    const filePath = path.join(__dirname, '../uploads/sheets', sheet.pdfFile);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.download(filePath, `${sheet.title}.pdf`);
  } catch (error) {
    console.error('Download sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get featured/popular sheets
// @route   GET /api/sheets/featured
// @access  Public
const getFeaturedSheets = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const sheets = await prisma.sheet.findMany({
      where: { status: 'approved' },
      include: {
        seller: { select: { penName: true } },
        faculty: { select: { name: true, code: true } },
      },
      orderBy: [
        { downloadCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: Number(limit),
    });

    res.json({
      success: true,
      data: sheets,
    });
  } catch (error) {
    console.error('Get featured sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Search sheets
// @route   GET /api/sheets/search
// @access  Public
const searchSheets = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      status: 'approved',
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { subjectCode: { contains: q, mode: 'insensitive' } },
        { subjectName: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
      ],
    };

    const [count, rows] = await Promise.all([
      prisma.sheet.count({ where: whereClause }),
      prisma.sheet.findMany({
        where: whereClause,
        include: {
          seller: { select: { penName: true } },
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
        query: q,
      },
    });
  } catch (error) {
    console.error('Search sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getSheets,
  getSheetById,
  getSheetsByFaculty,
  downloadSheet,
  getFeaturedSheets,
  searchSheets,
};