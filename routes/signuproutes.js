const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
    const{user_name,user_email,user_password} = req.body;
    const saltRounds = 12;
    const hashedPassword =await bcrypt.hash(user_password,12);

    const role = "user";
    const userKey = "uh9hbidjewcivuwgevdibqjwk";

    try{
        // Check if username already exists
        const [usernameResult] = await pool.query(
            'SELECT * FROM users WHERE user_name = ?',
            [user_name]
        );

        // Check if email already exists
        const [emailResult] = await pool.query(
            'SELECT * FROM users WHERE user_email = ?',
            [user_email]
        );

        if (usernameResult.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        if (emailResult.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const[result] =await pool.query('insert into users (user_email, user_name, user_password, user_key, role) VALUES (?,?,?,?,?)',[user_email,user_name,hashedPassword,userKey,role])
        res.status(201).json({
            user_name,
            user_email,
            hashedPassword,
            userKey,
            role
        })
    }
    catch (e){
        console.error(e);
    }
})

module.exports = router;