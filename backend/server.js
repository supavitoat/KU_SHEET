const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
// const fileUpload = require('express-fileupload'); // ปิดการใช้งาน เพราะใช้ multer แล้ว
require('dotenv').config();
// Inline environment validation (moved from envCheck.js)
(() => {
  const env = process.env.NODE_ENV || 'development';
  const requiredProd = ['JWT_SECRET'];
  const missing = requiredProd.filter(k => !process.env[k]);
  if (missing.length) {
    if (env === 'production') {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    } else {
      console.warn(`⚠️ Missing optional env in ${env}: ${missing.join(', ')}`);
    }
  }
  if (env === 'production' && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing in production.');
    process.exit(1);
  }
  if (!process.env.CORS_ORIGINS && !process.env.FRONTEND_URL) {
    console.warn('⚠️ Neither CORS_ORIGINS nor FRONTEND_URL is set. Defaulting to localhost dev origins.');
  }
})();

// Import database
const { prisma, testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const sheetRoutes = require('./routes/sheetRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const metadataRoutes = require('./routes/metadataRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const groupRoutes = require('./routes/groupRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reputationRoutes = require('./routes/reputationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const testRoutes = require('./routes/testRoutes');


const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
  connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Rate limiting
// Skip rate limiting for local test runs when NODE_ENV !== 'production' and tests set the X-Test-Run header.
const shouldSkipRateLimit = (req) => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return false;
  // Allow localhost IPs
  const ip = (req.ip || '').toString();
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')) return true;
  // Allow requests marked by test runner
  if ((req.headers && (req.headers['x-test-run'] === '1' || req.headers['x-test-run'] === 'true'))) return true;
  return false;
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // เพิ่มจำนวนครั้งที่อนุญาตให้เรียก API
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skip: shouldSkipRateLimit,
});

// Stripe webhook MUST use raw body, register BEFORE json parser
app.post('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }), require('./controllers/paymentController').stripeWebhook);

// CORS configuration (origins from env, comma-separated)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Disposition']
};

// Apply middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
// ปิดการใช้ express-fileupload เพราะใช้ multer แล้ว
// app.use(fileUpload({
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   abortOnLimit: true,
//   createParentPath: true,
//   useTempFiles: true,
//   tempFileDir: '/tmp/'
// }));

// Request logging disabled for clean console output
// Uncomment for debugging: console.log(`🌐 ${req.method} ${req.originalUrl}`);

// Apply rate limiting after CORS
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Readiness probe (lightweight DB ping)
app.get('/api/ready', async (req, res) => {
  try {
    // Simple fast query (no heavy joins)
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (e) {
    res.status(503).json({ status: 'degraded', error: e.message });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', chatRoutes);
app.use('/api', reputationRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reportRoutes);

// Mount dev-only test routes only in non-production environments
if ((process.env.NODE_ENV || 'development') !== 'production') {
  // Expose rateLimit stores to test controller via app.locals so it can attempt resets
  app.locals.rateLimitStores = {
    limiter: limiter.store,
    authLimiter: authLimiter.store
  };
  app.use('/api/test', testRoutes);
}


// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Prisma known request errors
  // Use code matching to map to HTTP status
  if (error.code) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Resource already exists',
        meta: error.meta,
      });
    }

    // Record not found
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Multer errors
  if (error.code && error.code.startsWith('LIMIT_')) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      details: error.message,
    });
  }

  // Busboy/Multipart errors
  if (error.message && error.message.includes('Unexpected end of form')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid form data. Please check your file uploads and try again.',
      details: 'The form data was incomplete or corrupted during upload.',
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    console.log('✅ Database ready with Prisma');

    // Start schedulers
    try {
      const { startGroupReminderScheduler } = require('./schedulers/groupReminder');
      startGroupReminderScheduler();
    } catch (e) {
      console.error('⚠️ Failed to start group reminder scheduler:', e.message);
    }

    // Socket.IO
    try {
      const { initSocket } = require('./realtime/socket');
      initSocket(server, allowedOrigins);
      console.log('🧩 Socket.IO initialized');
    } catch (e) {
      console.warn('⚠️ Socket.IO initialization skipped:', e.message);
    }

    // Start listening
    server.listen(PORT, () => {
      const corsList = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
      const fe = process.env.FRONTEND_URL || corsList[0] || 'http://localhost:5173';
      console.log(`🔗 Frontend URL: ${fe}`);
      console.log(`🚀 KU SHEET API Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Comment out SIGINT handler to prevent immediate shutdown during development
// process.on('SIGINT', async () => {
//   console.log('📡 SIGINT received, shutting down gracefully...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

module.exports = app;