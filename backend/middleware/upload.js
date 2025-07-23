const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = {
  sheets: path.join(__dirname, '../uploads/sheets'),
  covers: path.join(__dirname, '../uploads/covers'),
  previews: path.join(__dirname, '../uploads/previews'),
  slips: path.join(__dirname, '../uploads/slips'),
};

Object.values(uploadDirs).forEach(ensureDirExists);

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    switch (file.fieldname) {
      case 'pdf_file':
        uploadPath = uploadDirs.sheets;
        break;
      case 'cover_image':
        uploadPath = uploadDirs.covers;
        break;
      case 'preview_images':
        uploadPath = uploadDirs.previews;
        break;
      case 'payment_slip':
        uploadPath = uploadDirs.slips;
        break;
      default:
        uploadPath = path.join(__dirname, '../uploads/misc');
        ensureDirExists(uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'pdf_file': ['application/pdf'],
    'cover_image': ['image/jpeg', 'image/png', 'image/jpg'],
    'preview_images': ['image/jpeg', 'image/png', 'image/jpg'],
    'payment_slip': ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  };

  const allowedMimes = allowedTypes[file.fieldname] || [];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${allowedMimes.join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: {
      'pdf_file': 150 * 1024 * 1024, // 150MB
      'cover_image': 5 * 1024 * 1024, // 5MB
      'preview_images': 5 * 1024 * 1024, // 5MB per image
      'payment_slip': 10 * 1024 * 1024, // 10MB
    }
  },
});

// Custom middleware for different upload types
const uploadSheet = upload.fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'cover_image', maxCount: 1 },
  { name: 'preview_images', maxCount: 10 },
]);

const uploadPaymentSlip = upload.single('payment_slip');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
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

module.exports = {
  uploadSheet,
  uploadPaymentSlip,
  handleUploadError,
  uploadDirs,
};