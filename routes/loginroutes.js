const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
    const{user_name,user_password} = req.body;

    try{

        //Find the user by email
        const [user] = await pool.query('SELECT * FROM users WHERE user_name = ?', [user_name]);

        //Check if the user exists
        if (!user || user.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        let hashedPassword = user[0].user_password;

        //Compare the provided password with stored hashed password
        let isPasswordCorrect = await bcrypt.compare(user_password, hashedPassword);

       if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        //create jwt token
        const token = jwt.sign({
            userId: user[0].userId,
            user_name: user[0].user_name
        },process.env.JWT_SECRET, { expiresIn: '1h' })

        const refreshToken = jwt.sign({
            userId: user.userId
        }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        //Send response back with user info and token
        res.status(200).json({
            message: 'Login successful',
            user: {
                user_id: user[0].user_id,
                user_email: user[0].user_email,
                user_name: user[0].user_name,
                user_key: user[0].user_key,
                role: user[0].role
            },
            token,refreshToken  // Send the token as part of the response
        });
    }
    catch (e){
        console.error(e);
        res.status(500).json({ error: 'Something went wrong during login' });
    }
})


module.exports = router;