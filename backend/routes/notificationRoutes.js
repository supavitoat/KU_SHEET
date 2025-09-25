const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { listNotifications, markRead, markAllRead, createAndEmitNotification } = require('../controllers/notificationController');

router.get('/notifications', protect, listNotifications);
router.patch('/notifications/:id/read', protect, markRead);
router.patch('/notifications/read-all', protect, markAllRead);

module.exports = router;

// DEV ONLY: simple test endpoint
if (process.env.NODE_ENV !== 'production') {
	router.post('/notifications/test', protect, async (req, res) => {
		try {
			const item = await createAndEmitNotification({
				userId: req.user.id,
				type: 'system',
				title: 'ทดสอบการแจ้งเตือน',
				body: 'ระบบทำงานถูกต้อง',
				link: '/mysheet',
				data: { ts: Date.now() }
			});
			res.json({ success: true, data: item });
		} catch (e) {
			res.status(500).json({ success: false, message: 'Failed to create test notification' });
		}
	});
}
