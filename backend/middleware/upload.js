const multer = require('multer');
const path = require('path');
const fs = require('fs');

// สร้างโฟลเดอร์สำหรับอัพโหลด
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../uploads/sheets'),
    path.join(__dirname, '../uploads/covers'),
    path.join(__dirname, '../uploads/previews'),
    path.join(__dirname, '../uploads/slips')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // กำหนดโฟลเดอร์ตามประเภทไฟล์
    let uploadPath;
    switch (file.fieldname) {
      case 'pdf_file':
        uploadPath = path.join(__dirname, '../uploads/sheets');
        req.uploadPath = uploadPath;
        break;

      case 'preview_images':
        uploadPath = path.join(__dirname, '../uploads/previews');
        req.uploadPath = uploadPath;
        break;
      case 'payment_slip':
        uploadPath = path.join(__dirname, '../uploads/slips');
        req.uploadPath = uploadPath;
        break;
      case 'slipImage':
        uploadPath = path.join(__dirname, '../uploads/slips');
        req.uploadPath = uploadPath;
        break;
      default:
        uploadPath = path.join(__dirname, '../uploads/misc');
        req.uploadPath = uploadPath;
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // ฟังก์ชันสำหรับ decode ชื่อไฟล์ภาษาไทย
    const decodeThaiFilename = (filename) => {
      try {
        // ถ้าเป็น Buffer ให้แปลงเป็น string ก่อน
        if (Buffer.isBuffer(filename)) {
          filename = filename.toString('utf8');
        }
        
        // ลบ null bytes
        filename = filename.replace(/\0/g, '').trim();
        
        // ถ้าชื่อไฟล์มี pattern ของ encoding ที่เสียหาย ให้ลอง decode
        if (filename.includes('à¸') || filename.includes('à¹') || filename.includes('àº')) {
          // ลอง decode จาก latin1 เป็น utf8
          try {
            const decoded = Buffer.from(filename, 'latin1').toString('utf8');
            if (decoded && !decoded.includes('à¸') && !decoded.includes('à¹') && !decoded.includes('àº')) {
              // console.log('✅ Successfully decoded Thai filename:', filename, '→', decoded);
              return decoded;
            }
          } catch (e) {
            // console.log('❌ Failed to decode latin1:', e.message);
          }
          
          // ลอง decode จาก binary เป็น utf8
          try {
            const decoded = Buffer.from(filename, 'binary').toString('utf8');
            if (decoded && !decoded.includes('à¸') && !decoded.includes('à¹') && !decoded.includes('àº')) {
              // console.log('✅ Successfully decoded Thai filename:', filename, '→', decoded);
              return decoded;
            }
          } catch (e) {
            // console.log('❌ Failed to decode binary:', e.message);
          }
        }
        
        // ถ้าไม่สามารถ decode ได้ ให้ใช้ชื่อเดิม
        // console.log('📝 Using original filename:', filename);
        return filename;
      } catch (error) {
        console.error('❌ Error decoding filename:', error);
        return filename;
      }
    };
    
    // Decode ชื่อไฟล์
    let originalName = decodeThaiFilename(file.originalname);
    
    // ตรวจสอบว่ามีไฟล์ชื่อเดียวกันอยู่หรือไม่
    const uploadPath = req.uploadPath || path.join(__dirname, '../uploads/misc');
    const filePath = path.join(uploadPath, originalName);
    
    if (fs.existsSync(filePath)) {
      // ถ้ามีไฟล์ซ้ำ ให้เพิ่ม timestamp
      const extension = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, extension);
      const timestamp = Date.now();
      const newFileName = `${nameWithoutExt}_${timestamp}${extension}`;
      // console.log('📝 File exists, using new name:', newFileName);
      cb(null, newFileName);
    } else {
      // ถ้าไม่มีไฟล์ซ้ำ ใช้ชื่อเดิม
      // console.log('📝 Using filename:', originalName);
      cb(null, originalName);
    }
  }
});

// ตั้งค่า file filter
const fileFilter = (req, file, cb) => {
  // ตรวจสอบประเภทไฟล์
  if (file.fieldname === 'pdf_file') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
  } else if (file.fieldname === 'preview_images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
  } else if (file.fieldname === 'payment_slip') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
  } else {
    cb(null, true);
  }
};

// ตั้งค่า limits
const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB (เพิ่มขึ้นจาก 10MB)
  files: 10,
  fieldSize: 10 * 1024 * 1024, // 10MB for text fields
  fieldNameSize: 100, // 100 bytes for field names
  fields: 50 // max number of non-file fields
};

// สร้าง multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload;

// Middleware: enforce per-field logical size caps (after multer saves metadata)
// Usage: place after multer handler and before main controller
module.exports.enforceFieldLimits = (rules = {}) => {
  // rules example: { pdf_file: 50*1024*1024, preview_images: 2*1024*1024, payment_slip: 5*1024*1024, slipImage: 5*1024*1024 }
  return (req, res, next) => {
    try {
      const files = [];
      if (req.file) files.push(req.file);
      if (req.files) {
        if (Array.isArray(req.files)) files.push(...req.files);
        else Object.values(req.files).forEach(arr => Array.isArray(arr) && files.push(...arr));
      }
      for (const f of files) {
        const limit = rules[f.fieldname];
        if (limit && f.size > limit) {
          return res.status(400).json({ success: false, message: `ไฟล์ ${f.fieldname} เกินขนาดที่กำหนด (${Math.round(limit/1024/1024)}MB)` });
        }
      }
      next();
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Upload limit check failed', error: e.message });
    }
  };
};