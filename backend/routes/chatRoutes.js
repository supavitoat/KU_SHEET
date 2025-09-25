const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrCreateChat,
  sendMessage,
  getMessages,
  streamGroup
} = require('../controllers/chatController');

// Get or create chat for a group
router.get('/groups/:id/chat', protect, getOrCreateChat);

// Send a message to group chat
router.post('/groups/:id/chat/messages', protect, sendMessage);

// Get messages for a group
router.get('/groups/:id/chat/messages', protect, getMessages);

// SSE stream for real-time group chat
router.get('/groups/:id/chat/stream', streamGroup);

module.exports = router;
