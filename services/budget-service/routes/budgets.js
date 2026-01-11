const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../utils/db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper function to calculate budget status
const calculateBudgetStatus = (spent, limit, threshold) => {
    const percentage = (spent / limit) * 100;

    if (percentage >= 100) {
        return { status: 'exceeded', percentage, alert: 'over_budget' };
    } else if (percentage >= threshold) {
        return { status: 'near_limit', percentage, alert: 'near_limit' };
    } else if (percentage >= 75) {
        return { status: 'warning', percentage, alert: null };
    } else if (percentage >= 50) {
        return { status: 'moderate', percentage, alert: null };
    } else {
        return { status: 'on_track', percentage, alert: null };
    }
};

// GET /api/budgets - Get all budgets
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period, category } = req.query;

        let query = 'SELECT * FROM budgets WHERE user_id = ?';
        const params = [userId];

        if (period) {
            query += ' AND period = ?';
            params.push(period);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [budgets] = await db.query(query, params);

        // Calculate spent amount for each budget
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const [spentResult] = await db.query(
                `SELECT COALESCE(SUM(amount), 0) as spent 
         FROM transactions 
         WHERE user_id = ? AND category = ? AND type = 'expense' 
         AND date >= ? AND date <= ?`,
                [userId, budget.category, budget.start_date, budget.end_date]
            );

            const spent = parseFloat(spentResult[0].spent);
            const limit = parseFloat(budget.amount);
            const statusInfo = calculateBudgetStatus(spent, limit, budget.alert_threshold);

            return {
                ...budget,
                spent,
                remaining: limit - spent,
                ...statusInfo,
            };
        }));

        res.json({
            success: true,
            data: budgetsWithSpent,
        });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get budgets',
            error: error.message,
        });
    }
});

// POST /api/budgets - Create new budget
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { category, amount, period = 'monthly', start_date, end_date, alert_threshold = 80 } = req.body;

        if (!category || !amount || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Category, amount, start_date, and end_date are required',
            });
        }

        const id = uuidv4();

        await db.query(
            `INSERT INTO budgets (id, user_id, category, amount, period, start_date, end_date, alert_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, category, amount, period, start_date, end_date, alert_threshold]
        );

        const [budgets] = await db.query('SELECT * FROM budgets WHERE id = ?', [id]);

        res.status(201).json({
            success: true,
            message: 'Budget created successfully',
            data: budgets[0],
        });
    } catch (error) {
        console.error('Create budget error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Budget for this category and period already exists',
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create budget',
            error: error.message,
        });
    }
});

// GET /api/budgets/status - Get budget status overview
router.get('/status', async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();

        // Get active budgets (current date within budget period)
        const [budgets] = await db.query(
            `SELECT * FROM budgets 
       WHERE user_id = ? AND start_date <= ? AND end_date >= ?`,
            [userId, now, now]
        );

        const statusOverview = await Promise.all(budgets.map(async (budget) => {
            const [spentResult] = await db.query(
                `SELECT COALESCE(SUM(amount), 0) as spent 
         FROM transactions 
         WHERE user_id = ? AND category = ? AND type = 'expense' 
         AND date >= ? AND date <= ?`,
                [userId, budget.category, budget.start_date, budget.end_date]
            );

            const spent = parseFloat(spentResult[0].spent);
            const limit = parseFloat(budget.amount);
            const statusInfo = calculateBudgetStatus(spent, limit, budget.alert_threshold);

            return {
                id: budget.id,
                category: budget.category,
                limit,
                spent,
                remaining: limit - spent,
                period: budget.period,
                ...statusInfo,
            };
        }));

        // Calculate overall stats
        const totalBudget = statusOverview.reduce((sum, b) => sum + b.limit, 0);
        const totalSpent = statusOverview.reduce((sum, b) => sum + b.spent, 0);
        const overBudgetCount = statusOverview.filter(b => b.status === 'exceeded').length;
        const nearLimitCount = statusOverview.filter(b => b.status === 'near_limit').length;

        res.json({
            success: true,
            data: {
                summary: {
                    total_budget: totalBudget,
                    total_spent: totalSpent,
                    total_remaining: totalBudget - totalSpent,
                    overall_percentage: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0,
                    over_budget_count: overBudgetCount,
                    near_limit_count: nearLimitCount,
                },
                budgets: statusOverview,
            },
        });
    } catch (error) {
        console.error('Get budget status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get budget status',
            error: error.message,
        });
    }
});

// GET /api/budgets/alerts - Get active budget alerts
router.get('/alerts', async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();

        const [budgets] = await db.query(
            `SELECT * FROM budgets 
       WHERE user_id = ? AND start_date <= ? AND end_date >= ?`,
            [userId, now, now]
        );

        const alerts = [];

        for (const budget of budgets) {
            const [spentResult] = await db.query(
                `SELECT COALESCE(SUM(amount), 0) as spent 
         FROM transactions 
         WHERE user_id = ? AND category = ? AND type = 'expense' 
         AND date >= ? AND date <= ?`,
                [userId, budget.category, budget.start_date, budget.end_date]
            );

            const spent = parseFloat(spentResult[0].spent);
            const limit = parseFloat(budget.amount);
            const percentage = (spent / limit) * 100;

            if (percentage >= budget.alert_threshold) {
                alerts.push({
                    budget_id: budget.id,
                    category: budget.category,
                    limit,
                    spent,
                    percentage: percentage.toFixed(2),
                    alert_type: percentage >= 100 ? 'over_budget' : 'near_limit',
                    message: percentage >= 100
                        ? `You've exceeded your ${budget.category} budget by ${(spent - limit).toFixed(2)}!`
                        : `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget.`,
                });
            }
        }

        res.json({
            success: true,
            data: alerts,
        });
    } catch (error) {
        console.error('Get budget alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get budget alerts',
            error: error.message,
        });
    }
});

// GET /api/budgets/:id - Get budget by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const [budgets] = await db.query(
            'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (budgets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found',
            });
        }

        const budget = budgets[0];

        // Get spent amount
        const [spentResult] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as spent 
       FROM transactions 
       WHERE user_id = ? AND category = ? AND type = 'expense' 
       AND date >= ? AND date <= ?`,
            [userId, budget.category, budget.start_date, budget.end_date]
        );

        const spent = parseFloat(spentResult[0].spent);
        const limit = parseFloat(budget.amount);
        const statusInfo = calculateBudgetStatus(spent, limit, budget.alert_threshold);

        res.json({
            success: true,
            data: {
                ...budget,
                spent,
                remaining: limit - spent,
                ...statusInfo,
            },
        });
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get budget',
            error: error.message,
        });
    }
});

// PUT /api/budgets/:id - Update budget
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { amount, alert_threshold, end_date } = req.body;

        const [existing] = await db.query(
            'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found',
            });
        }

        const updates = [];
        const values = [];

        if (amount !== undefined) {
            updates.push('amount = ?');
            values.push(amount);
        }
        if (alert_threshold !== undefined) {
            updates.push('alert_threshold = ?');
            values.push(alert_threshold);
        }
        if (end_date) {
            updates.push('end_date = ?');
            values.push(end_date);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update',
            });
        }

        values.push(id);
        await db.query(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, values);

        const [budgets] = await db.query('SELECT * FROM budgets WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Budget updated successfully',
            data: budgets[0],
        });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update budget',
            error: error.message,
        });
    }
});

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found',
            });
        }

        await db.query('DELETE FROM budgets WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Budget deleted successfully',
        });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete budget',
            error: error.message,
        });
    }
});

module.exports = router;
