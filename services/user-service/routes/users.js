const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const authMiddleware = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, name, currency, monthly_income, created_at, updated_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            data: users[0],
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message,
        });
    }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, currency, monthly_income } = req.body;
        const userId = req.user.userId;

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (currency) {
            updates.push('currency = ?');
            values.push(currency);
        }
        if (monthly_income !== undefined) {
            updates.push('monthly_income = ?');
            values.push(monthly_income);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update',
            });
        }

        values.push(userId);
        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const [users] = await db.query(
            'SELECT id, email, name, currency, monthly_income, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: users[0],
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
});

// GET /api/users/preferences
router.get('/preferences', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT currency, monthly_income FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            data: users[0],
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get preferences',
            error: error.message,
        });
    }
});

// PUT /api/users/preferences
router.put('/preferences', authMiddleware, async (req, res) => {
    try {
        const { currency, monthly_income } = req.body;
        const userId = req.user.userId;

        await db.query(
            'UPDATE users SET currency = ?, monthly_income = ? WHERE id = ?',
            [currency, monthly_income, userId]
        );

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: { currency, monthly_income },
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences',
            error: error.message,
        });
    }
});

module.exports = router;
