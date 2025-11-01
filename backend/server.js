const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
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

// When running behind a reverse proxy (Render, Heroku, Cloud Run, etc.)
// Express needs to trust the proxy so that `req.ip` and X-Forwarded-* headers
// are interpreted correctly. express-rate-limit validates X-Forwarded-For
// and will throw if trust proxy is not enabled while the header is present.
// Set to 1 to trust the first proxy hop (typical for managed platforms).
app.set('trust proxy', 1);

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

// Root route: redirect to frontend if FRONTEND_URL is set, otherwise show a small info message
app.get('/', (req, res) => {
  const fe = process.env.FRONTEND_URL;
  // Avoid redirecting to localhost during production if FRONTEND_URL wasn't updated
  if (fe && !fe.includes('localhost')) return res.redirect(fe);

  // Fallback to first CORS origin if available and not localhost
  const corsList = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (corsList.length && !corsList[0].includes('localhost')) return res.redirect(corsList[0]);

  // Otherwise show a simple informational message instead of redirecting to localhost
  res.type('text').send('KU Sheet API - visit /api/health for status');
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
// If a frontend build exists (frontend/dist), serve it as static files
// and fall back to index.html for non-API routes so SPA client-side
// routing works when users open deep links (e.g. /admin/infoSheet/10).
try {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    app.get('*', (req, res, next) => {
      // Skip API and upload routes so they continue to the API handlers
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
} catch (e) {
  console.warn('Could not enable frontend static serving fallback:', e.message);
}

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