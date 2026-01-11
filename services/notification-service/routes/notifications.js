const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../utils/db');
const authMiddleware = require('../middleware/auth');
const { publishNotification } = require('../utils/redis');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/notifications - Get all notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, is_read, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        if (is_read !== undefined) {
            query += ' AND is_read = ?';
            params.push(is_read === 'true');
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [notifications] = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
        const countParams = [userId];
        if (type) {
            countQuery += ' AND type = ?';
            countParams.push(type);
        }
        if (is_read !== undefined) {
            countQuery += ' AND is_read = ?';
            countParams.push(is_read === 'true');
        }

        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
            error: error.message,
        });
    }
});

// GET /api/notifications/unread - Get unread count
router.get('/unread', async (req, res) => {
    try {
        const userId = req.user.userId;

        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: {
                unread_count: result[0].count,
            },
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message,
        });
    }
});

// POST /api/notifications - Create notification (internal use)
router.post('/', async (req, res) => {
    try {
        const { user_id, type, title, message, related_id, related_type, action_url } = req.body;

        if (!user_id || !type || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'user_id, type, title, and message are required',
            });
        }

        const id = uuidv4();

        await db.query(
            `INSERT INTO notifications (id, user_id, type, title, message, related_id, related_type, action_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, user_id, type, title, message, related_id, related_type, action_url]
        );

        const [notifications] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
        const notification = notifications[0];

        // Publish to Redis for real-time delivery
        await publishNotification(`notification:${user_id}`, notification);

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification,
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message,
        });
    }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        await db.query(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message,
        });
    }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', async (req, res) => {
    try {
        const userId = req.user.userId;

        await db.query(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message,
        });
    }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        await db.query('DELETE FROM notifications WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message,
        });
    }
});

// DELETE /api/notifications - Delete all notifications
router.delete('/', async (req, res) => {
    try {
        const userId = req.user.userId;

        await db.query('DELETE FROM notifications WHERE user_id = ?', [userId]);

        res.json({
            success: true,
            message: 'All notifications deleted successfully',
        });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete all notifications',
            error: error.message,
        });
    }
});

module.exports = router;
