const express = require('express');
const { all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 1. Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    const unreadCountRow = await all(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );
    const unreadCount = unreadCountRow[0]?.count || 0;

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

// 2. Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await run(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// 3. Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await run(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

module.exports = router;
