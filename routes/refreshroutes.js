const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Get the refresh token from the cookie

    // If no refresh token is provided, reject the request
    if (!refreshToken) {
        return res.status(401).json({error: 'No refresh token provided'});
    }

    // Verify refresh token using JWT_SECRET or JWT_REFRESH_SECRET
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({error: 'Invalid refresh token'});
        }

        // If refresh token is valid, generate a new access token
        const newAccessToken = jwt.sign({userId: user.userId}, process.env.JWT_SECRET, {expiresIn: '1h'});

        // Send new access token to the client
        res.json({accessToken: newAccessToken});
    });
});

module.exports = router;