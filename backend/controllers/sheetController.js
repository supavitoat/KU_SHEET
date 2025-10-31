const { prisma } = require('../config/database');
const path = require('path');
const fs = require('fs');
const { 
  createSubjectNameJSON, 
  parseSubjectNameJSON, 
  getSubjectNameByLanguage, 
  formatSheetResponse, 
  prepareSheetData 
} = require('../utils/subjectNameHelpers');
const { withPrismaRetry } = require('../utils/prismaRetry');
const { sanitizePagination } = require('../utils/validation');

function parsePositiveInt(v){ const n = Number(v); return Number.isInteger(n)&&n>0?n:null; }
function capText(t,max=100){ if(!t||typeof t!=='string') return t; return t.length>max?t.slice(0,max):t; }

// @desc    Get all approved sheets with filters
// @route   GET /api/sheets
// @access  Public
const getSheets = async (req, res) => {
  try {
    const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { maxLimit: 60, defaultLimit:12 });
    const { faculty, term, year, type, major, search, seller, sort='createdAt', order='DESC', isFree } = req.query;

    const whereClause = { status:'APPROVED' };
    if (faculty) whereClause.faculty = faculty;
    if (term) whereClause.term = term;
    if (year) whereClause.year = Number(year);
    if (major) whereClause.major = major;
    if (seller) whereClause.sellerId = Number(seller);
    if (isFree !== undefined) whereClause.isFree = (isFree === 'true' || isFree === true);
    if (search) {
      const s = capText(search,80);
      whereClause.OR = [ { title:{ contains:s } }, { subjectCode:{ contains:s } }, { major:{ contains:s } }, { shortDescription:{ contains:s } } ];
    }

    const sortFieldMap = { created_at:'createdAt', updated_at:'updatedAt', subject_code:'subjectCode', faculty:'faculty', major:'major', short_description:'shortDescription', preview_images:'previewImages', admin_message:'adminMessage', download_count:'downloadCount', is_free:'isFree' };
    const mappedSort = sortFieldMap[sort] || sort;
    const orderDir = order.toLowerCase()==='desc'?'desc':'asc';

    // Build include object dynamically to avoid passing `false` which Prisma may reject
    const includeObj = {
      seller: { select: { penName: true, user: { select: { fullName: true, picture: true } } } }
    };
    if (req.user) {
      includeObj.orders = { where: { userId: req.user.id, status: 'VERIFIED' }, select: { id: true }, take: 1 };
    }

    const [count, rows] = await Promise.all([
      withPrismaRetry(() => prisma.sheet.count({ where: whereClause })),
      withPrismaRetry(() => prisma.sheet.findMany({ where: whereClause, include: includeObj, skip, take: limit, orderBy: { [mappedSort]: orderDir } }))
    ]);

    const sheetIds = rows.map(s=>s.id);
    let reviewStatsBySheetId = new Map();
    let downloadStatsBySheetId = new Map();
    if(sheetIds.length){
      const [reviewGrouped, downloadGrouped] = await Promise.all([
        withPrismaRetry(()=> prisma.review.groupBy({ by:['sheetId'], where:{ sheetId:{ in: sheetIds } }, _avg:{ rating:true }, _count:{ _all:true } })),
        withPrismaRetry(()=> prisma.order.groupBy({ by:['sheetId'], where:{ sheetId:{ in: sheetIds }, status:'VERIFIED' }, _count:{ id:true } }))
      ]);
      reviewStatsBySheetId = new Map(reviewGrouped.map(g=>[g.sheetId,{ avgRating:g._avg.rating||0, reviewCount:g._count._all||0 }]));
      downloadStatsBySheetId = new Map(downloadGrouped.map(g=>[g.sheetId, g._count.id||0]));
    }

    const formattedSheets = rows.map(sheet => { const formatted = formatSheetResponse(sheet); const stats = reviewStatsBySheetId.get(sheet.id) || { avgRating:0, reviewCount:0 }; formatted.avgRating = stats.avgRating; formatted.reviewCount = stats.reviewCount; formatted.downloadCount = downloadStatsBySheetId.get(sheet.id) || 0; if(req.user) formatted.userHasPurchased = Array.isArray(sheet.orders) && sheet.orders.length>0; return formatted; });

    res.json({ success:true, data:{ sheets:formattedSheets, pagination:{ current_page: page, total_pages: Math.ceil(count/limit), total_items: count, items_per_page: limit } } });
  } catch (error) {
    console.error('[Sheet] getSheets error', { message:error.message, stack:error.stack });
    res.status(500).json({ success:false, message:'Server error' });
  }
};

// @desc    Get sheet stats (rating, review count, download count)
// @route   GET /api/sheets/:id/stats
// @access  Public
const getSheetStats = async (req, res) => { try { const sheetId = parsePositiveInt(req.params.id); if(!sheetId) return res.status(400).json({ success:false, message:'Invalid id' }); const [reviewStats, downloadStats] = await Promise.all([
  withPrismaRetry(()=> prisma.review.aggregate({ where:{ sheetId }, _avg:{ rating:true }, _count:{ id:true } })),
  withPrismaRetry(()=> prisma.order.aggregate({ where:{ sheetId, status:'VERIFIED' }, _count:{ id:true } }))
]); const stats = { avgRating: reviewStats._avg.rating||0, reviewCount: reviewStats._count.id||0, downloadCount: downloadStats._count.id||0 }; res.json({ success:true, data: stats }); } catch (error) { console.error('[Sheet] getSheetStats error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Get sheet by ID
// @route   GET /api/sheets/:id
// @access  Public
const getSheetById = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id); if(!id) return res.status(400).json({ success:false, message:'Invalid id' });
    let whereClause = { id };
    if (req.user) {
      if (req.user.seller) {
        whereClause = { id, OR:[ { status:'APPROVED' }, { sellerId: req.user.seller.id } ] };
      } else { whereClause = { id, status:'APPROVED' }; }
    } else { whereClause = { id, status:'APPROVED' }; }

    const sheet = await withPrismaRetry(() => prisma.sheet.findFirst({
      where: whereClause,
      include: {
        seller: {
          select: {
            penName: true,
            bankName: true,
            bankAccount: true,
            accountName: true,
            user: { select: { fullName: true, picture: true } }
          }
        },
        orders: {
          where: { status: 'VERIFIED' },
          select: { id: true, status: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } }
      }
    }));
    if(!sheet) return res.status(404).json({ success:false, message:'Sheet not found' });

    let hasPurchased = false;
    if(req.user){ const existingOrder = await withPrismaRetry(()=> prisma.order.findFirst({ where:{ userId:req.user.id, sheetId: sheet.id, status:'VERIFIED' } })); hasPurchased = !!existingOrder; }

    const ratings = sheet.reviews.map(r=>r.rating); const avgRating = ratings.length? ratings.reduce((a,b)=>a+b,0)/ratings.length : 0; const formattedSheet = formatSheetResponse(sheet); formattedSheet.avgRating = Math.round(avgRating*10)/10; formattedSheet.reviewCount = sheet._count.reviews;
    try { const filePath = path.join(__dirname,'../uploads/sheets', sheet.pdfFile); const stat = fs.statSync(filePath); formattedSheet.fileSizeBytes = stat.size; } catch {}

    res.json({ success:true, data:{ sheet: formattedSheet, hasPurchased } });
  } catch (error) { console.error('[Sheet] getSheetById error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); }
};

// @desc    Get sheets by faculty
// @route   GET /api/sheets/faculty/:facultyId
// @access  Public
const getSheetsByFaculty = async (req, res) => { try { const { facultyId } = req.params; const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { defaultLimit:12, maxLimit:60 }); const { term, year, type, search, sort='created_at', order='DESC' } = req.query; const whereClause = { status:'APPROVED', faculty: facultyId }; if(term) whereClause.term = term; if(year) whereClause.year = Number(year); if(search){ const s = capText(search,80); whereClause.OR = [ { title:{ contains:s, mode:'insensitive' } }, { subjectCode:{ contains:s, mode:'insensitive' } }, { subjectName:{ contains:s, mode:'insensitive' } }, { shortDescription:{ contains:s, mode:'insensitive' } } ]; } const [count, rows] = await Promise.all([ withPrismaRetry(()=> prisma.sheet.count({ where: whereClause })), withPrismaRetry(()=> prisma.sheet.findMany({ where: whereClause, include:{ seller:{ select:{ penName:true } }, orders:{ where:{ status:'VERIFIED' }, select:{ id:true, status:true }, take:1, orderBy:{ createdAt:'desc' } } }, skip, take: limit, orderBy:{ [sort]: order.toLowerCase()==='desc'?'desc':'asc' } })) ]); const sheetIds = rows.map(s=>s.id); let downloadStatsBySheetId = new Map(); if(sheetIds.length){ const downloadGrouped = await withPrismaRetry(()=> prisma.order.groupBy({ by:['sheetId'], where:{ sheetId:{ in: sheetIds }, status:'VERIFIED' }, _count:{ id:true } })); downloadStatsBySheetId = new Map(downloadGrouped.map(g=>[g.sheetId, g._count.id||0])); } const sheetsWithDownloadCount = rows.map(sheet=>({ ...sheet, downloadCount: downloadStatsBySheetId.get(sheet.id)||0 })); res.json({ success:true, data:{ sheets: sheetsWithDownloadCount, pagination:{ current_page: page, total_pages: Math.ceil(count/limit), total_items: count, items_per_page: limit } } }); } catch (error) { console.error('[Sheet] getSheetsByFaculty error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Download sheet file (requires purchase verification)
// @route   GET /api/sheets/:id/download
// @access  Private
const downloadSheet = async (req, res) => { try { const id = parsePositiveInt(req.params.id); if(!id) return res.status(400).json({ success:false, message:'Invalid id' }); const sheet = await withPrismaRetry(()=> prisma.sheet.findFirst({ where:{ id, status:'APPROVED' } })); if(!sheet) return res.status(404).json({ success:false, message:'Sheet not found' }); if(!sheet.isFree){ const order = await withPrismaRetry(()=> prisma.order.findFirst({ where:{ userId:req.user.id, sheetId: sheet.id, status:{ in:['VERIFIED','PAID'] } } })); if(!order) return res.status(403).json({ success:false, message:'You need to purchase this sheet first. Payment verification required.' }); if(!(['PAID','VERIFIED'].includes(order.paymentStatus)) && order.status!=='VERIFIED') return res.status(403).json({ success:false, message:'Payment verification pending. Please wait for admin approval.' }); if(order.status==='CANCELLED') return res.status(403).json({ success:false, message:'This order has been cancelled.' }); }
  const updatedSheet = await withPrismaRetry(()=> prisma.sheet.update({ where:{ id: sheet.id }, data:{ downloadCount:{ increment:1 } } }));
  const filePath = path.join(__dirname,'../uploads/sheets', sheet.pdfFile); if(!fs.existsSync(filePath)) return res.status(404).json({ success:false, message:'File not found' }); const safeTitle = `${sheet.title}`.replace(/[\\/:*?"<>|]/g,'_'); res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.pdf"`); res.setHeader('Content-Type','application/pdf'); res.sendFile(filePath); } catch (error) { console.error('[Sheet] downloadSheet error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Download free sheet file (no authentication required)
// @route   GET /api/sheets/:id/download-free
// @access  Public
const downloadFreeSheet = async (req, res) => { try { const id = parsePositiveInt(req.params.id); if(!id) return res.status(400).json({ success:false, message:'Invalid id' }); const sheet = await withPrismaRetry(()=> prisma.sheet.findFirst({ where:{ id, status:'APPROVED', isFree:true } })); if(!sheet) return res.status(404).json({ success:false, message:'Free sheet not found' }); await withPrismaRetry(()=> prisma.sheet.update({ where:{ id: sheet.id }, data:{ downloadCount:{ increment:1 } } })); const filePath = path.join(__dirname,'../uploads/sheets', sheet.pdfFile); if(!fs.existsSync(filePath)) return res.status(404).json({ success:false, message:'File not found' }); res.download(filePath, `${sheet.title}.pdf`); } catch (error) { console.error('[Sheet] downloadFreeSheet error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Get featured/popular sheets
// @route   GET /api/sheets/featured
// @access  Public
const getFeaturedSheets = async (req, res) => { try { const { limit=8 } = req.query; const sheets = await withPrismaRetry(()=> prisma.sheet.findMany({ where:{ status:'APPROVED' }, include:{ seller:{ select:{ penName:true } }, orders:{ where:{ status:'VERIFIED' }, select:{ id:true, status:true }, take:1, orderBy:{ createdAt:'desc' } } }, orderBy:[ { downloadCount:'desc' }, { createdAt:'desc' } ], take: Number(limit) })); const sheetIds = sheets.map(s=>s.id); let downloadStatsBySheetId = new Map(); if(sheetIds.length){ const downloadGrouped = await withPrismaRetry(()=> prisma.order.groupBy({ by:['sheetId'], where:{ sheetId:{ in: sheetIds }, status:'VERIFIED' }, _count:{ id:true } })); downloadStatsBySheetId = new Map(downloadGrouped.map(g=>[g.sheetId, g._count.id||0])); } const sheetsWithDownloadCount = sheets.map(sheet=>({ ...sheet, downloadCount: downloadStatsBySheetId.get(sheet.id)||0 })); res.json({ success:true, data: sheetsWithDownloadCount }); } catch (error) { console.error('[Sheet] getFeaturedSheets error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Search sheets
// @route   GET /api/sheets/search
// @access  Public
const searchSheets = async (req, res) => { try { const { q, page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { defaultLimit:12, maxLimit:60, extra: { q:req.query.q } }); const queryString = (req.query.q||'').toString(); if(!queryString) return res.status(400).json({ success:false, message:'Search query is required' }); const qLimited = capText(queryString,80); const whereClause = { status:'APPROVED', OR:[ { title:{ contains:qLimited } }, { subjectCode:{ contains:qLimited } }, { major:{ contains:qLimited } }, { shortDescription:{ contains:qLimited } } ] }; const [count, rows] = await Promise.all([ withPrismaRetry(()=> prisma.sheet.count({ where: whereClause })), withPrismaRetry(()=> prisma.sheet.findMany({ where: whereClause, include:{ seller:{ select:{ penName:true } }, orders:{ where:{ status:'VERIFIED' }, select:{ id:true, status:true }, take:1, orderBy:{ createdAt:'desc' } } }, skip, take: limit, orderBy:{ createdAt:'desc' } })) ]); const sheetIds = rows.map(s=>s.id); let downloadStatsBySheetId = new Map(); if(sheetIds.length){ const downloadGrouped = await withPrismaRetry(()=> prisma.order.groupBy({ by:['sheetId'], where:{ sheetId:{ in: sheetIds }, status:'VERIFIED' }, _count:{ id:true } })); downloadStatsBySheetId = new Map(downloadGrouped.map(g=>[g.sheetId, g._count.id||0])); } const sheetsWithDownloadCount = rows.map(sheet=>({ ...sheet, downloadCount: downloadStatsBySheetId.get(sheet.id)||0 })); res.json({ success:true, data:{ sheets: sheetsWithDownloadCount, pagination:{ current_page: page, total_pages: Math.ceil(count/limit), total_items: count, items_per_page: limit }, query: qLimited } }); } catch (error) { console.error('[Sheet] searchSheets error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Get user's purchased sheets
// @route   GET /api/sheets/my-sheets
// @access  Private
const getMySheets = async (req, res) => { try { const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { defaultLimit:10, maxLimit:50 }); const [count, sheets] = await Promise.all([ withPrismaRetry(()=> prisma.order.count({ where:{ userId:req.user.id, status:{ in:['PAID','VERIFIED'] } } })), withPrismaRetry(()=> prisma.order.findMany({ where:{ userId:req.user.id, status:{ in:['PAID','VERIFIED'] } }, include:{ sheet:{ select:{ id:true,title:true,subjectCode:true,faculty:true,major:true,shortDescription:true,price:true,previewImages:true,pdfFile:true,createdAt:true } } }, orderBy:{ createdAt:'desc' }, skip, take: limit })) ]); res.json({ success:true, data:{ sheets: sheets.map(o=>o.sheet), pagination:{ current_page: page, total_pages: Math.ceil(count/limit), total_items: count, items_per_page: limit } } }); } catch (error) { console.error('[Sheet] getMySheets error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

module.exports = { getSheets, getSheetById, getSheetsByFaculty, downloadSheet, downloadFreeSheet, getFeaturedSheets, searchSheets, getMySheets, getSheetStats };