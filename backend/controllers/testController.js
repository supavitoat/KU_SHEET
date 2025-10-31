const { prisma } = require('../config/database');
// Optionally interact with authController to clear its in-memory throttle during tests
let authController;
try {
  authController = require('./authController');
} catch (e) {
  // ignore - only best-effort during tests
}

// Dev-only helpers for test runs
const resetRateLimitForIp = async (req, res) => {
  try {
    // rateLimit stores are attached to app locals in server.js if available
    const storeInfo = req.app.locals.rateLimitStores || {};
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // Try to reset per-store for this IP if store supports resetKey
    Object.values(storeInfo).forEach(store => {
      try {
        if (store && typeof store.resetKey === 'function') {
          store.resetKey(ip);
        }
      } catch (e) {
        // ignore per-store reset errors
      }
    });

    // Also clear authController's in-memory throttle (best-effort)
    try {
      if (authController && typeof authController.clearAuthThrottle === 'function') {
        authController.clearAuthThrottle();
      }
    } catch (e) {
      // ignore
    }

    return res.json({ success: true, message: 'Rate limit reset attempted for IP', ip });
  } catch (error) {
    console.error('[Test] resetRateLimitForIp error', error);
    return res.status(500).json({ success: false, message: 'Failed to reset rate limits', error: error.message });
  }
};

const resetTestData = async (_req, res) => {
  try {
    // Remove users created by tests (emails starting with testuser)
    await prisma.user.deleteMany({ where: { email: { startsWith: 'testuser' } } });
    // Optionally clean other test data here if needed
    return res.json({ success: true, message: 'Test data cleanup completed' });
  } catch (error) {
    console.error('[Test] resetTestData error', error);
    return res.status(500).json({ success: false, message: 'Failed to cleanup test data', error: error.message });
  }
};

const resetAll = async (req, res) => {
  try {
    await resetTestData(req, { json: () => {} });
    await resetRateLimitForIp(req, res);
  } catch (error) {
    console.error('[Test] resetAll error', error);
    return res.status(500).json({ success: false, message: 'Failed to perform full reset', error: error.message });
  }
};

module.exports = {
  resetRateLimitForIp,
  resetTestData,
  resetAll
};
