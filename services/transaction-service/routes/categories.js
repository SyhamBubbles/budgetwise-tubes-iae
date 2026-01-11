const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;

        let query = 'SELECT * FROM categories';
        const params = [];

        if (type) {
            query += ' WHERE type = ?';
            params.push(type);
        }

        query += ' ORDER BY name';

        const [categories] = await db.query(query, params);

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get categories',
            error: error.message,
        });
    }
});

module.exports = router;
