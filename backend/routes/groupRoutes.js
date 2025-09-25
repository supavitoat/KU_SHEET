const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  createGroup,
  listGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  approveMember,
  leaveGroup,
  cancelGroup,
  getMyGroups,
  startGroup,
  finishGroup,
  checkInMember,
  exportAttendeesCsv,
  setPinnedAnnouncement,
  clearPinnedAnnouncement,
  markNoShow,
} = require('../controllers/groupController');

// Public list and detail (optional auth to show my membership status)
router.get('/', optionalAuth, listGroups);
router.get('/:id', optionalAuth, getGroupById);

// My groups
router.get('/me/list', protect, getMyGroups);

// Create group
router.post('/', protect, createGroup);

// Update group (organizer only)
router.put('/:id', protect, updateGroup);

// Delete group (organizer only)
router.delete('/:id', protect, deleteGroup);

// Membership actions
router.post('/:id/join', protect, joinGroup);
router.post('/:id/approve/:memberId', protect, approveMember);
router.post('/:id/leave', protect, leaveGroup);
router.post('/:id/cancel', protect, cancelGroup);
// Lifecycle actions
router.post('/:id/start', protect, startGroup);
router.post('/:id/finish', protect, finishGroup);

// Check-in and export
router.post('/:id/checkin/:memberId', protect, checkInMember);
router.get('/:id/attendees/export', protect, exportAttendeesCsv);

// Pinned announcement
router.post('/:id/announcement', protect, setPinnedAnnouncement);
router.delete('/:id/announcement', protect, clearPinnedAnnouncement);

// No-show mark (after completion)
router.post('/:id/noshow/:memberId', protect, markNoShow);

module.exports = router;


