const rateLimit = require('express-rate-limit');

// General rate limiter - 500 requests per minute (for normal app usage)
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter - 20 requests per 15 minutes (stricter for login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter };
