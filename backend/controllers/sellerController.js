const { prisma } = require('../config/database');
const path = require('path');
const { createSubjectNameJSON, prepareSheetData, formatSheetResponse } = require('../utils/subjectNameHelpers');
const { withPrismaRetry } = require('../utils/prismaRetry');
const { sanitizePagination } = require('../utils/validation');
function parsePositiveInt(v){ const n=Number(v); return Number.isInteger(n)&&n>0?n:null; }

// @desc    Register as seller
// @route   POST /api/seller/register
// @access  Private
const registerSeller = async (req, res) => {
  try {
    const { pen_name, phone, bank_name, bank_account, account_name, prompt_pay_id } = req.body;

    // Get user's real name from the authenticated user
  const user = await withPrismaRetry(() => prisma.user.findUnique({
      where: { id: req.user.id },
      select: { fullName: true }
  }));

    if (!user || !user.fullName) {
      return res.status(400).json({
        success: false,
        message: 'User full name is required',
      });
    }

    // Check if user is already a seller
  const existingSeller = await withPrismaRetry(() => prisma.seller.findFirst({ where: { userId: req.user.id } }));
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'User is already registered as a seller',
      });
    }

    // Check if pen name is already taken
  const existingPenName = await withPrismaRetry(() => prisma.seller.findFirst({ where: { penName: pen_name } }));
    if (existingPenName) {
      return res.status(400).json({
        success: false,
        message: 'Pen name is already taken',
      });
    }

    // Generate unique seller ID
    const sellerId = `SELLER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create seller profile with default bank info if not provided
  const seller = await withPrismaRetry(() => prisma.seller.create({
      data: {
        userId: req.user.id,
        penName: pen_name,
        phone,
        bankName: bank_name ?? '',
        bankAccount: bank_account ?? '',
        accountName: account_name ?? '',
        promptPayId: prompt_pay_id ?? null,
        sellerId: sellerId,
      },
  }));

    // Update user is_seller flag
  await withPrismaRetry(() => prisma.user.update({
      where: { id: req.user.id },
      data: { isSeller: true },
  }));

    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      data: seller,
    });
  } catch (error) {
    console.error('[Seller] Register seller error', { message: error.message, stack: error.stack });
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
  const seller = await withPrismaRetry(() => prisma.seller.findFirst({
      where: { userId: req.user.id },
      include: {
        user: { select: { email: true, fullName: true } },
      },
  }));

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    // เพิ่ม fallback ถ้า field เป็น null
    const bankName = seller.bankName || '';
    const bankAccount = seller.bankAccount || '';
    const accountName = seller.accountName || '';

    res.json({
      success: true,
      data: {
        ...seller,
        bankName,
        bankAccount,
        accountName,
      },
    });
  } catch (error) {
    console.error('[Seller] Get seller profile error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update seller profile
// @route   PUT /api/seller/profile
// @access  Private (Seller)
const updateSellerProfile = async (req, res) => {
  try {
    const { pen_name, phone, bank_name, bank_account, account_name, prompt_pay_id } = req.body;

  const seller = await withPrismaRetry(() => prisma.seller.findFirst({ where: { userId: req.user.id } }));
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    // Check if pen name is taken by another seller
    if (pen_name !== seller.penName) {
  const existingPenName = await withPrismaRetry(() => prisma.seller.findFirst({
        where: {
          penName: pen_name,
          NOT: { id: seller.id },
        },
  }));
      if (existingPenName) {
        return res.status(400).json({
          success: false,
          message: 'Pen name is already taken',
        });
      }
    }

    // Update seller profile
  const updatedSeller = await withPrismaRetry(() => prisma.seller.update({
      where: { id: seller.id },
      data: {
        penName: pen_name,
        phone,
        bankName: bank_name,
        bankAccount: bank_account,
        accountName: account_name,
        promptPayId: prompt_pay_id,
      },
  }));

    res.json({
      success: true,
      message: 'Seller profile updated successfully',
      data: updatedSeller,
    });
  } catch (error) {
    console.error('[Seller] Update seller profile error', { message: error.message, stack: error.stack });
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
    
    
  // Log specific required fields
    
    const {
      title,
      thaiSubjectName,
      englishSubjectName,
      description,
      subjectCode,
      section,
      semester,
      academicYear,
      price,
      bankDetails,
      faculty,         // รับชื่อคณะ
      major            // รับชื่อสาขา
    } = req.body;

  // Debug log สำหรับข้อมูลที่รับ

    // Get seller info first
  const seller = await withPrismaRetry(() => prisma.seller.findFirst({ where: { userId: req.user.id } }));
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }
    
    // Validate required fields
    if (!title || !description || !subjectCode || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // Validate subject names (support both naming conventions)
    const thaiName = thaiSubjectName || '';
    const englishName = englishSubjectName || '';
    
    // ไม่บังคับให้กรอกชื่อวิชาภาษาไทยและภาษาอังกฤษ
    // if (!thaiName || !englishName) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'กรุณากรอกชื่อวิชาภาษาไทยและภาษาอังกฤษ'
    //   });
    // }

    // Validate price
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'ราคาต้องเป็นตัวเลขและไม่ติดลบ'
      });
    }

    // Parse bankDetails if it's a JSON string
    let parsedBankDetails = null;
    if (bankDetails) {
      try {
        parsedBankDetails = JSON.parse(bankDetails);
      } catch (error) {
        console.warn('[Seller] Error parsing bankDetails', { message: error.message });
      }
    }

    // Validate bank details if price > 0
    if (numericPrice > 0) {
      if (!parsedBankDetails || !parsedBankDetails.accountName || !parsedBankDetails.accountNumber || !parsedBankDetails.bankName) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกข้อมูลธนาคารให้ครบถ้วน'
        });
      }
    }
    
    // ไม่บังคับให้กรอกข้อมูลธนาคารเมื่อราคาเป็น 0
    // if (numericPrice === 0) {
    //   // Free sheet - no bank details required
    // }

    // Get files from request
    const pdfFile = req.files?.pdf_file?.[0];
    const previewImages = req.files?.preview_images || [];

    if (!pdfFile) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาอัพโหลดไฟล์ PDF'
      });
    }

    // ตรวจสอบว่ามีชื่อคณะและสาขาหรือไม่
    if (!faculty || typeof faculty !== 'string' || faculty.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกคณะ'
      });
    }
    if (!major || typeof major !== 'string' || major.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกสาขา'
      });
    }

    // ตรวจสอบว่าชื่อคณะและสาขาไม่เป็นค่าว่าง
    if (typeof faculty !== 'string' || faculty.trim() === '' || 
        typeof major !== 'string' || major.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลคณะและสาขาไม่ถูกต้อง'
      });
    }

    // ไม่ต้อง query database สำหรับ faculty และ subject อีกต่อไป
    // ใช้ชื่อที่ Frontend ส่งมาโดยตรง

    // ไม่ต้อง query database สำหรับ faculty และ subject อีกต่อไป
    // ใช้ชื่อที่ Frontend ส่งมาโดยตรง
    
    
    
    // Create sheet data using schema field names
    const sheetData = {
      title,
      subjectCode,
      subjectNameJSON: createSubjectNameJSON(
        thaiSubjectName,
        englishSubjectName
      ),
      section,
      shortDescription: description,

      term: semester,
      year: parseInt(academicYear),
      price: numericPrice,
      isFree: numericPrice === 0, // ตั้งค่า isFree ตามราคา
      faculty: faculty, // ใช้ชื่อคณะจาก Frontend โดยตรง
      major: major, // ใช้ชื่อสาขาจาก Frontend โดยตรง
      sellerId: seller.id,
      status: 'PENDING',
      pdfFile: pdfFile.filename, // ใช้ชื่อไฟล์จาก multer โดยตรง
      previewImages: previewImages.length > 0 ? JSON.stringify(previewImages.map(img => img.filename)) : null
    };



    // Create sheet in database
  const sheet = await withPrismaRetry(() => prisma.sheet.create({
      data: sheetData,
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
  }));

    res.status(201).json({
      success: true,
      message: 'สร้างชีทสำเร็จ',
      data: sheet
    });

  } catch (error) {
    console.error('[Seller] Error creating sheet', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างชีท',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get seller's sheets
// @route   GET /api/seller/sheets
// @access  Private (Seller)
const getSellerSheets = async (req, res) => {
  try {
    const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { defaultLimit:10, maxLimit:50 });
    const { status } = req.query;

    const seller = await withPrismaRetry(() => prisma.seller.findFirst({ where: { userId: req.user.id } }));
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }
    const whereClause = { sellerId: seller.id };

    if (status) {
      whereClause.status = status;
    }

    const [count, rows] = await Promise.all([
      withPrismaRetry(() => prisma.sheet.count({ where: whereClause })),
      withPrismaRetry(() => prisma.sheet.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          subjectCode: true,
          faculty: true,
          major: true,
          shortDescription: true,
          price: true,
          status: true,
          adminMessage: true,
          createdAt: true,
          subjectNameJSON: true,
          seller: {
            select: {
              penName: true,
              user: {
                select: {
                  fullName: true,
                  picture: true
                }
              }
            }
          },
          orders: {
            where: {
              status: 'VERIFIED'
            },
            select: {
              id: true
            }
          },
          _count: {
            select: {
              reviews: true,
              orders: {
                where: {
                  status: 'VERIFIED'
                }
              }
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })),
    ]);

    // Format sheets with bilingual subject names and add rating/review data
    const formattedSheets = rows.map(sheet => {
      const formatted = formatSheetResponse(sheet);
      
      // Calculate average rating
      const ratings = sheet.reviews.map(review => review.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      // Get review count and download count
      const reviewCount = sheet._count.reviews;
      const downloadCount = sheet._count.orders;
      
      return {
        ...formatted,
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        reviewCount,
        downloadCount
      };
    });

    res.json({
      success: true,
      data: formattedSheets,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('[Seller] Get seller sheets error', { message: error.message, stack: error.stack });
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
    const {
      title,
      description,
      price,
      subjectCode,
      semester,
      academicYear,
      faculty,        // รับชื่อคณะจาก Frontend
      major,        // รับชื่อสาขาจาก Frontend
      bankDetails,
      keep_existing_pdf,
      keep_existing_preview,
      subjectNameThai,
      subjectNameEnglish,
      thaiSubjectName,
      englishSubjectName,
      section
    } = req.body;

    // Support both seller and admin access
    let sellerId;
    let isAdmin = false;
    
    if (req.user.role === 'ADMIN') {
  isAdmin = true;
      
    } else {
      sellerId = req.user.seller.id;
    }

    // Validate required fields
    if (!title || !description || !subjectCode || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบว่ามีชื่อคณะและสาขาหรือไม่
    if (!faculty || typeof faculty !== 'string' || faculty.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกคณะ'
      });
    }
    if (!major || typeof major !== 'string' || major.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกสาขา'
      });
    }

    // Validate subject names (support both naming conventions)
    const thaiName = subjectNameThai || thaiSubjectName;
    const englishName = subjectNameEnglish || englishSubjectName;
    
    if (!thaiName || !englishName) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อวิชาภาษาไทยและภาษาอังกฤษ'
      });
    }

    // Validate price
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'ราคาต้องเป็นตัวเลขและไม่ติดลบ'
      });
    }

    // Parse bankDetails if it's a JSON string
    let parsedBankDetails = null;
    if (bankDetails) {
      try {
        parsedBankDetails = JSON.parse(bankDetails);
      } catch (error) {
        console.error('[Seller] Error parsing bankDetails', { message: error.message, stack: error.stack });
      }
    }

    // Validate bank details if price > 0
    if (numericPrice > 0) {
      if (!parsedBankDetails || !parsedBankDetails.accountName || !parsedBankDetails.accountNumber || !parsedBankDetails.bankName) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกข้อมูลธนาคารให้ครบถ้วน'
        });
      }
    }

    // Check if sheet exists (admin can edit any sheet, seller can only edit their own)
    let whereClause = { id: parseInt(id) };
    if (!isAdmin) {
      whereClause.sellerId = sellerId;
    }
    
    const existingSheet = await prisma.sheet.findFirst({
      where: whereClause
    });

    if (!existingSheet) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชีท'
      });
    }

    // Get sellerId from the sheet if admin
    if (isAdmin) {
      sellerId = existingSheet.sellerId;
    }

    // ตรวจสอบว่าสามารถแก้ไขได้เฉพาะชีทที่มีสถานะ PENDING หรือ REJECTED (เฉพาะ seller)
    if (!isAdmin && existingSheet.status !== 'PENDING' && existingSheet.status !== 'REJECTED') {
      return res.status(403).json({
        success: false,
        message: 'ไม่สามารถแก้ไขชีทได้ เนื่องจากชีทนี้ได้รับการอนุมัติแล้ว'
      });
    }

    // Get files from request
    const pdfFile = req.files?.pdf_file?.[0];
    const previewImages = req.files?.preview_images || [];
    
    

  // ใช้ชื่อคณะและสาขาจาก Frontend โดยตรง (ไม่ต้องตรวจสอบ ID)

  // ไม่ต้อง query database สำหรับ faculty และ subject อีกต่อไป ใช้ชื่อที่ Frontend ส่งมาโดยตรง
    
    // Prepare update data using schema field names
    const updateData = {
      title,
      subjectCode,
      subjectNameJSON: createSubjectNameJSON(
        thaiSubjectName,
        englishSubjectName
      ),
      section,
      shortDescription: description,
      term: semester,
      year: parseInt(academicYear),
      price: numericPrice,
      isFree: numericPrice === 0, // อัพเดท isFree ตามราคา
      faculty: faculty, // ใช้ชื่อคณะจาก Frontend โดยตรง
      major: major, // ใช้ชื่อสาขาจาก Frontend โดยตรง
      status: 'PENDING' // Reset status when updated
    };

    // Handle PDF file - ไม่บังคับให้อัพโหลดไฟล์ใหม่
    if (pdfFile && !keep_existing_pdf) {
      updateData.pdfFile = pdfFile.filename; // ใช้ชื่อไฟล์จาก multer โดยตรง
    } else if (keep_existing_pdf === 'true') {
      // ใช้ไฟล์เดิม
      updateData.pdfFile = existingSheet.pdfFile;
    }

    // Merge keep_previews กับ preview_images ใหม่
    let keepPreviews = [];
    if (req.body.keep_previews) {
      try {
        keepPreviews = JSON.parse(req.body.keep_previews);
      } catch {}
    }
    const newPreviewFiles = req.files?.preview_images || [];
    const newPreviewNames = newPreviewFiles.map(img => img.filename);
    const allPreviewNames = [...keepPreviews, ...newPreviewNames];
    if (allPreviewNames.length > 0) {
      updateData.previewImages = JSON.stringify(allPreviewNames);
    } else {
      updateData.previewImages = null; // หรือ '[]' ถ้า schema เป็น string
    }



    // Update sheet
    const updatedSheet = await prisma.sheet.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
    });

    // Update seller's bank info if provided (especially for admin updates)
    if (parsedBankDetails && sellerId) {
      try {
        await prisma.seller.update({
          where: { id: sellerId },
          data: {
            bankName: parsedBankDetails.bankName,
            bankAccount: parsedBankDetails.accountNumber,
            accountName: parsedBankDetails.accountName
          }
        });
      } catch (bankUpdateError) {
        console.error('[Seller] Error updating seller bank info', { message: bankUpdateError.message, stack: bankUpdateError.stack });
        // ไม่ return error เพราะชีทอัปเดตสำเร็จแล้ว
      }
    }

    // ลบไฟล์ pdf เก่าถ้ามีการอัปโหลดไฟล์ใหม่
    if (pdfFile && !keep_existing_pdf) {
      const fs = require('fs');
      const oldPdfFile = existingSheet.pdfFile;
      if (oldPdfFile && oldPdfFile !== pdfFile.filename) {
        const oldPath = path.join(__dirname, '../uploads/sheets/', oldPdfFile);
        fs.unlink(oldPath, (err) => {
          if (err) {
            console.error('[Seller] Failed to delete old sheet PDF', { message: err.message, stack: err.stack });
          }
        });
      }
    }

    // ลบไฟล์ preview image เก่าถ้ามีการอัปโหลด preview ใหม่ (ลบทุกไฟล์เก่าที่ไม่อยู่ใน keep_previews)
    if (newPreviewFiles.length > 0) {
      const fs = require('fs');
      let oldPreviewImages = [];
      if (existingSheet.previewImages) {
        try {
          if (typeof existingSheet.previewImages === 'string') {
            oldPreviewImages = JSON.parse(existingSheet.previewImages);
          } else if (Array.isArray(existingSheet.previewImages)) {
            oldPreviewImages = existingSheet.previewImages;
          }
          } catch (err) {
            console.error('[Seller] Failed to delete old sheet PDF', { message: err.message, stack: err.stack });
        }
      }
      // ชื่อไฟล์ preview ใหม่ทั้งหมด
      const newPreviewFilenames = newPreviewFiles.map(img => img.filename);
      // ลบทุกไฟล์ preview เก่าที่ไม่อยู่ใน keep_previews และไม่อยู่ใน preview ใหม่
      for (const oldImg of oldPreviewImages) {
        if (!keepPreviews.includes(oldImg) && !newPreviewFilenames.includes(oldImg)) {
          const oldPath = path.join(__dirname, '../uploads/previews/', oldImg);
          try {
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          } catch (err) {
            console.error('[Seller] Failed to delete preview image', { message: err.message, stack: err.stack });
          }
        }
      }
    }

    // หลังอัปเดต sheet สำเร็จ
    if (req.body.remove_previews) {
      let removePreviews = [];
      try {
        removePreviews = JSON.parse(req.body.remove_previews);
      } catch {}
      const fs = require('fs');
      removePreviews.forEach(filename => {
        const oldPath = path.join(__dirname, '../uploads/previews/', filename);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (err) {
          console.error('[Seller] Failed to delete preview image', { message: err.message, stack: err.stack });
        }
      });
    }

    res.json({
      success: true,
      message: 'อัปเดตชีทสำเร็จ',
      data: updatedSheet
    });

  } catch (error) {
    console.error('[Seller] Error updating sheet', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตชีท'
    });
  }
};

// @desc    Get seller revenue history
// @route   GET /api/seller/revenue
// @access  Private (Seller)
const getSellerRevenue = async (req, res) => {
  try {
    const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { defaultLimit:10, maxLimit:50 });
    const seller = await withPrismaRetry(() => prisma.seller.findFirst({ where: { userId: req.user.id } }));
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

  const { getCommissionRateFraction } = require('../utils/appSettings');
    const commissionRate = await getCommissionRateFraction();

    // Get verified orders (completed sales) and payout slips
    const [count, rows, totalRevenue, payouts] = await Promise.all([
      withPrismaRetry(() => prisma.order.count({
        where: {
          sellerId: seller.id,
          status: 'VERIFIED',
        },
      })),
      withPrismaRetry(() => prisma.order.findMany({
        where: {
          sellerId: seller.id,
          status: 'VERIFIED',
        },
        include: {
          sheet: { select: { title: true, subjectCode: true } },
          user: { select: { fullName: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { verifiedDate: 'desc' },
      })),
      withPrismaRetry(() => prisma.order.aggregate({
        _sum: { amount: true },
        where: {
          sellerId: seller.id,
          status: 'VERIFIED',
        },
      })),
      withPrismaRetry(() => prisma.payout.findMany({
        where: {
          sellerId: seller.id,
        },
        orderBy: { createdAt: 'desc' },
      })),
    ]);

    // Calculate seller's net revenue (after commission deduction)
    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const totalCommission = Math.round((totalRevenueAmount * commissionRate) * 100) / 100;
    const netRevenue = Math.round((totalRevenueAmount - totalCommission) * 100) / 100;

    // Add commission information to individual transactions
    const transactionsWithCommission = rows.map(transaction => ({
      ...transaction,
      grossAmount: transaction.amount,
      commissionAmount: Math.round((transaction.amount * commissionRate) * 100) / 100,
      netAmount: Math.round((transaction.amount - (transaction.amount * commissionRate)) * 100) / 100
    }));

    res.json({
      success: true,
      data: {
        transactions: transactionsWithCommission,
        total_revenue: netRevenue, // This is now net revenue after commission
        gross_revenue: totalRevenueAmount, // Original total for reference
        total_commission: totalCommission,
        commission_rate: Math.round(commissionRate * 100), // Return as percentage
        payouts: payouts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('[Seller] Get seller revenue error', { message: error.message, stack: error.stack });
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
    const idNum = parseInt(req.params.id);
    if(!Number.isInteger(idNum) || idNum<=0) return res.status(400).json({ success:false, message:'Invalid id'});
    const seller = await withPrismaRetry(() => prisma.seller.findFirst({ where: { userId: req.user.id } }));
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

  const sheet = await withPrismaRetry(() => prisma.sheet.findFirst({ where: { id: idNum, sellerId: seller.id } }));

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found',
      });
    }

  const hasOrders = await withPrismaRetry(() => prisma.order.findFirst({ where: { sheetId: sheet.id } }));

    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sheet that has orders',
      });
    }

  await withPrismaRetry(() => prisma.sheet.delete({ where: { id: sheet.id } }));

    res.json({
      success: true,
      message: 'Sheet deleted successfully',
    });
  } catch (error) {
    console.error('[Seller] Delete sheet error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error during sheet deletion',
      error: error.message,
    });
  }
};

// ดึงชีทของ seller ตาม id
const getSellerSheetById = async (req, res) => {
  try {
    const seller = await withPrismaRetry(() => prisma.seller.findFirst({ where: { userId: req.user.id } }));
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
  const sheet = await withPrismaRetry(() => prisma.sheet.findFirst({
      where: { id: Number(req.params.id), sellerId: seller.id },
      include: {
        seller: {
          select: {
            id: true,
            penName: true,
            phone: true,
            bankName: true,
            bankAccount: true,
            accountName: true,
            totalRevenue: true,
            userId: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    }));
    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }
    
    // Debug: แสดงข้อมูลที่ได้จากฐานข้อมูล
    
    
    // ส่งข้อมูลครบถ้วน รวมถึง field ไฟล์
    res.json({ 
      success: true, 
      data: {
        ...sheet,
        // รองรับทั้ง field เก่าและใหม่
        previewImage: sheet.previewImage, // field เก่า
        previewImages: sheet.previewImages, // field ใหม่ (JSON string)
        filePath: sheet.filePath, // field เก่า
        pdfFile: sheet.pdfFile, // field ใหม่
        section: sheet.section, // หมู่เรียน
        // ส่ง subjectCode ที่ผู้ใช้กรอกจริง (ไม่ใช่จากตาราง subjects)
        subjectCode: sheet.subjectCode
      }
    });
  } catch (error) {
    console.error('[Seller] getSellerSheetById error', { message: error.message, stack: error.stack });
    res.status(500).json({ success:false, message: error.message });
  }
};


// @desc    Get seller notifications (new payouts with slips)
// @route   GET /api/seller/notifications
// @access  Private (Seller)
const getSellerNotifications = async (req, res) => {
  try {
    const sellerId = req.user.sellerId;

    // ดึงข้อมูล payouts ที่มีสลิปใหม่ (ใน 7 วันที่ผ่านมา)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const notifications = await withPrismaRetry(() => prisma.payout.findMany({
      where: {
        sellerId: sellerId,
        status: 'COMPLETED',
        slipImagePath: {
          not: null
        },
        slipUploadDate: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        slipUploadDate: 'desc'
      },
      take: 10
  }));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('[Seller] Error getting seller notifications', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน'
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
  getSellerSheetById,
  getSellerNotifications,
};