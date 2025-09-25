const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitFeedback, getReputation, getMyFeedbackForGroup } = require('../controllers/reputationController');

router.post('/users/:userId/feedback', protect, (req, res, next) => {
  // targetUserId comes from params for clarity
  req.body.targetUserId = Number(req.params.userId);
  return submitFeedback(req, res, next);
});

router.get('/users/:userId/reputation', protect, getReputation);

// My feedbacks for a group (to keep star color)
router.get('/groups/:id/my-feedback', protect, getMyFeedbackForGroup);

module.exports = router;


