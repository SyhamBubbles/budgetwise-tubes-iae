const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../utils/db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/transactions - Get all transactions with filters
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, category, start_date, end_date, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [userId];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (start_date) {
            query += ' AND date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [transactions] = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
        const countParams = [userId];
        if (type) {
            countQuery += ' AND type = ?';
            countParams.push(type);
        }
        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }
        if (start_date) {
            countQuery += ' AND date >= ?';
            countParams.push(start_date);
        }
        if (end_date) {
            countQuery += ' AND date <= ?';
            countParams.push(end_date);
        }

        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions',
            error: error.message,
        });
    }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, amount, category, description, payment_method, date, room_id } = req.body;

        if (!type || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: 'Type, amount, category, and date are required',
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be "income" or "expense"',
            });
        }

        const id = uuidv4();

        await db.query(
            `INSERT INTO transactions (id, user_id, room_id, type, amount, category, description, payment_method, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, room_id || null, type, amount, category, description, payment_method, date]
        );

        const [transactions] = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transactions[0],
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create transaction',
            error: error.message,
        });
    }
});

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const [transactions] = await db.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        res.json({
            success: true,
            data: transactions[0],
        });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transaction',
            error: error.message,
        });
    }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { type, amount, category, description, payment_method, date } = req.body;

        // Check if transaction exists and belongs to user
        const [existing] = await db.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        const updates = [];
        const values = [];

        if (type) {
            updates.push('type = ?');
            values.push(type);
        }
        if (amount !== undefined) {
            updates.push('amount = ?');
            values.push(amount);
        }
        if (category) {
            updates.push('category = ?');
            values.push(category);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (payment_method !== undefined) {
            updates.push('payment_method = ?');
            values.push(payment_method);
        }
        if (date) {
            updates.push('date = ?');
            values.push(date);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update',
            });
        }

        values.push(id);
        await db.query(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, values);

        const [transactions] = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Transaction updated successfully',
            data: transactions[0],
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update transaction',
            error: error.message,
        });
    }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        await db.query('DELETE FROM transactions WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Transaction deleted successfully',
        });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete transaction',
            error: error.message,
        });
    }
});

// GET /api/transactions/summary/daily - Get daily summary
router.get('/summary/daily', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const [summary] = await db.query(
            `SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
       FROM transactions 
       WHERE user_id = ? AND date = ?
       GROUP BY type`,
            [userId, targetDate]
        );

        const result = {
            date: targetDate,
            income: 0,
            expense: 0,
            income_count: 0,
            expense_count: 0,
        };

        summary.forEach(row => {
            if (row.type === 'income') {
                result.income = parseFloat(row.total);
                result.income_count = row.count;
            } else {
                result.expense = parseFloat(row.total);
                result.expense_count = row.count;
            }
        });

        result.balance = result.income - result.expense;

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get daily summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily summary',
            error: error.message,
        });
    }
});

// GET /api/transactions/summary/monthly - Get monthly summary
router.get('/summary/monthly', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { year, month } = req.query;
        const targetYear = year || new Date().getFullYear();
        const targetMonth = month || new Date().getMonth() + 1;

        const [summary] = await db.query(
            `SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
       FROM transactions 
       WHERE user_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
       GROUP BY type`,
            [userId, targetYear, targetMonth]
        );

        const [byCategory] = await db.query(
            `SELECT 
        category,
        type,
        SUM(amount) as total,
        COUNT(*) as count
       FROM transactions 
       WHERE user_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
       GROUP BY category, type
       ORDER BY total DESC`,
            [userId, targetYear, targetMonth]
        );

        const result = {
            year: parseInt(targetYear),
            month: parseInt(targetMonth),
            income: 0,
            expense: 0,
            income_count: 0,
            expense_count: 0,
            by_category: byCategory,
        };

        summary.forEach(row => {
            if (row.type === 'income') {
                result.income = parseFloat(row.total);
                result.income_count = row.count;
            } else {
                result.expense = parseFloat(row.total);
                result.expense_count = row.count;
            }
        });

        result.balance = result.income - result.expense;
        result.savings_rate = result.income > 0
            ? ((result.income - result.expense) / result.income * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get monthly summary',
            error: error.message,
        });
    }
});

module.exports = router;
