require('dotenv').config();
const express = require('express');
const cors = require('cors');
const roomRoutes = require('./routes/rooms');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'room-service' });
});

// Routes
app.use('/api/rooms', roomRoutes);

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
    console.log(`🚀 Room Service running on port ${PORT}`);
});
