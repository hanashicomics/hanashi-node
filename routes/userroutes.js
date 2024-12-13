const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const verifyToken = require('../middleware/verifyToken')

router.put('/:id',verifyToken, async (req, res) => {
    //const { id } = req.params;
    console.log('PUT request received'); // Log when the request is received
    const { user_id,user_email, user_name, user_password } = req.body;

    // Validate input
    if (!user_email || !user_name || !user_password) {
        return res.status(400).json({ error: 'All fields (email, username, password) are required' });
    }

    try {
        // Check if the new email or username already exists in the database
        const [existingEmail] = await pool.query('SELECT * FROM users WHERE user_email = ? AND user_id != ?', [user_email, user_id]);
        if (existingEmail.length > 0) {
            return res.status(409).json({ error: 'Email is already taken by another user' });
        }

        const [existingUsername] = await pool.query('SELECT * FROM users WHERE user_name = ? AND user_id != ?', [user_name, user_id]);
        if (existingUsername.length > 0) {
            return res.status(409).json({ error: 'Username is already taken by another user' });
        }

        // Hash password before saving (use bcrypt or any password hashing library)
        const hashedPassword = await bcrypt.hash(user_password, 10); // bcrypt example

        // Update the user in the database
        const result = await pool.query(
            'UPDATE users SET user_email = ?, user_name = ?, user_password = ? WHERE user_id = ?',
            [user_email, user_name, hashedPassword, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the new email or username already exists in the database
        const [updatedUserDetails] = await pool.query('SELECT * FROM users WHERE user_email = ? AND user_id != ?', [user_email,user_id]);
        if (updatedUserDetails.length === 0) {
            return res.status(404).json({ error: 'Could not retrieve updated details' });
        }
        console.log(updatedUserDetails[0]);
        // Respond with success
        res.json({
            message: 'User updated successfully',
            user: {
                user_id: updatedUserDetails[0].user_id,
                user_email: updatedUserDetails[0].user_email,
                user_name: updatedUserDetails[0].user_name,
                user_key: updatedUserDetails[0].user_key,
                role: updatedUserDetails[0].role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id',async (req,res)=> {
    const { id } = req.params;
    const {user_email, user_name, user_password } = req.body;

    // Validate input
    if (!user_email || !user_name || !user_password) {
        return res.status(400).json({ error: 'All fields (email, username, password) are required' });
    }

    try {
        // Update the user in the database
        const result = await pool.query(
            'DELETE FROM users WHERE user_id = ?;',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Respond with success
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = router;