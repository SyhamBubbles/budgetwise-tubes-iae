const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Load RSA keys
const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || path.join(__dirname, '../../shared/keys/private.pem');
const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || path.join(__dirname, '../../shared/keys/public.pem');

let privateKey, publicKey;

try {
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    console.log('✅ RSA keys loaded successfully');
} catch (error) {
    console.error('❌ Failed to load RSA keys:', error.message);
    process.exit(1);
}

const JWT_OPTIONS = {
    algorithm: 'RS256',
    issuer: 'budgetwise',
};

// Generate Access Token (15 minutes)
const generateAccessToken = (payload) => {
    return jwt.sign(payload, privateKey, {
        ...JWT_OPTIONS,
        expiresIn: '15m',
    });
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, privateKey, {
        ...JWT_OPTIONS,
        expiresIn: '7d',
    });
};

// Verify Token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            issuer: 'budgetwise',
        });
    } catch (error) {
        return null;
    }
};

// Get Public Key (for other services)
const getPublicKey = () => publicKey;

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    getPublicKey,
};
