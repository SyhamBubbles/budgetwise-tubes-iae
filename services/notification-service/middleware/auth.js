const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || path.join(__dirname, '../../shared/keys/public.pem');

let publicKey;

try {
    publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    console.log('✅ Public key loaded successfully');
} catch (error) {
    console.error('❌ Failed to load public key:', error.message);
    process.exit(1);
}

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token required',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            issuer: 'budgetwise',
        });

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

module.exports = authMiddleware;
