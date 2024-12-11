const jwt = require('jsonwebtoken');
const pool = require('../db');

const authenticateToken = (req, res, next) => {
    // Get the token from Authorization header
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Token is required' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Attach user info to request object for access in the next middleware
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;