const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Protect routes - authenticate user
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          seller: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is a seller
const requireSeller = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: req.user.id }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered as a seller to access this route'
      });
    }

    req.seller = seller;
    next();

  } catch (error) {
    console.error('Require seller middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in seller authorization'
    });
  }
};

// Optional authentication - user info if token exists
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue without user
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          seller: true
        }
      });

      req.user = user || null;
      next();

    } catch (error) {
      // Token invalid, continue without user
      req.user = null;
      next();
    }

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Rate limiting by user
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequestCounts = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [key, value] of userRequestCounts.entries()) {
      if (value.windowStart < windowStart) {
        userRequestCounts.delete(key);
      }
    }

    // Get or create user entry
    let userEntry = userRequestCounts.get(userId);
    if (!userEntry || userEntry.windowStart < windowStart) {
      userEntry = {
        count: 0,
        windowStart: now
      };
      userRequestCounts.set(userId, userEntry);
    }

    // Check if limit exceeded
    if (userEntry.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Limit is ${maxRequests} requests per ${windowMs / 1000 / 60} minutes.`
      });
    }

    // Increment count
    userEntry.count++;
    next();
  };
};

module.exports = {
  protect,
  authorize,
  requireSeller,
  optionalAuth,
  rateLimitByUser
};