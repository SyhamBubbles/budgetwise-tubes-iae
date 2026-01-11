require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { generalLimiter, authLimiter } = require('./middleware/rateLimit');
const { optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3002';
const BUDGET_SERVICE_URL = process.env.BUDGET_SERVICE_URL || 'http://localhost:3003';
const ROOM_SERVICE_URL = process.env.ROOM_SERVICE_URL || 'http://localhost:3004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4000';

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies for non-proxied routes
app.use(express.json());

// Apply rate limiting
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'api-gateway',
        services: {
            user: USER_SERVICE_URL,
            transaction: TRANSACTION_SERVICE_URL,
            budget: BUDGET_SERVICE_URL,
            room: ROOM_SERVICE_URL,
            notification: NOTIFICATION_SERVICE_URL,
            analytics: ANALYTICS_SERVICE_URL,
        }
    });
});

// Proxy configuration
const proxyOptions = {
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable',
            error: err.message,
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        // Forward authorization header
        if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
        }

        // Handle body for POST/PUT requests
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
};

// Auth routes (with stricter rate limiting)
app.use('/api/auth', authLimiter, createProxyMiddleware({
    target: USER_SERVICE_URL,
    ...proxyOptions,
}));

// User routes
app.use('/api/users', createProxyMiddleware({
    target: USER_SERVICE_URL,
    ...proxyOptions,
}));

// Transaction routes
app.use('/api/transactions', createProxyMiddleware({
    target: TRANSACTION_SERVICE_URL,
    ...proxyOptions,
}));

// Category routes
app.use('/api/categories', createProxyMiddleware({
    target: TRANSACTION_SERVICE_URL,
    ...proxyOptions,
}));

// Budget routes
app.use('/api/budgets', createProxyMiddleware({
    target: BUDGET_SERVICE_URL,
    ...proxyOptions,
}));

// Room routes
app.use('/api/rooms', createProxyMiddleware({
    target: ROOM_SERVICE_URL,
    ...proxyOptions,
}));

// Notification routes
app.use('/api/notifications', createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    ...proxyOptions,
}));

// GraphQL proxy (Analytics)
app.use('/graphql', createProxyMiddleware({
    target: ANALYTICS_SERVICE_URL,
    ...proxyOptions,
    ws: true, // Enable WebSocket proxy for subscriptions
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal gateway error',
        error: err.message,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📡 Routing to services:`);
    console.log(`   - User Service: ${USER_SERVICE_URL}`);
    console.log(`   - Transaction Service: ${TRANSACTION_SERVICE_URL}`);
    console.log(`   - Budget Service: ${BUDGET_SERVICE_URL}`);
    console.log(`   - Room Service: ${ROOM_SERVICE_URL}`);
    console.log(`   - Notification Service: ${NOTIFICATION_SERVICE_URL}`);
    console.log(`   - Analytics Service: ${ANALYTICS_SERVICE_URL}`);
});
