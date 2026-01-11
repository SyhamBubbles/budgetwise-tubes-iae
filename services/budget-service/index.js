require('dotenv').config();
const express = require('express');
const cors = require('cors');
const budgetRoutes = require('./routes/budgets');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'budget-service' });
});

// Routes
app.use('/api/budgets', budgetRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Budget Service running on port ${PORT}`);
});
