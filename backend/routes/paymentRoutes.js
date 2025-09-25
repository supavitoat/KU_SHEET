const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const { validateDiscountPreview } = require('../controllers/discountController');

// Create payment session (requires auth)
router.post('/session', protect, paymentController.createPaymentSession);

// PromptPay Payment System (ฟรี ปลอดภัย ใช้งานได้จริง)
router.post('/promptpay/create', protect, paymentController.createPromptPaySession);
router.post('/promptpay/verify', protect, paymentController.verifyPromptPayPayment);
router.get('/promptpay/status/:sessionId', protect, paymentController.getPromptPayStatus);
// Validate discount code for current cart
router.post('/discounts/validate', protect, validateDiscountPreview);

// Stripe Payment (optional)
router.post('/stripe/create-checkout-session', protect, paymentController.createStripeCheckoutSession);

// Stripe Webhook is registered at app level in server.js with raw body. Avoid duplicate here.
// router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// Webhooks (no auth) - gate legacy providers by env flag
if (process.env.ENABLE_LEGACY_WEBHOOKS === 'true') {
	router.post('/webhook/xendit', express.json({ type: '*/*' }), paymentController.xenditWebhook);
	router.post('/webhook/omise', express.json({ type: '*/*' }), paymentController.omiseWebhook);
}

// Polling session status (requires auth)
router.get('/session/:externalId/status', protect, paymentController.getSessionStatus);

// Real-time payment detection (requires auth)
router.get('/detect/:externalId', protect, paymentController.detectPaymentRealtime);

module.exports = router;



