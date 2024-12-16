const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

router.get('/', async (req, res) =>{
   try{
       const[rows] = await pool.query('SELECT * FROM blog');

       if(rows.length===0){
           res.status(404).json({error:'No blogs were found :('});
       }
       res.json(rows);
   }
   catch (e){
       console.error(e);
       res.status(404).json({error:'Something went wrong with fetching blogs'})
   }
});

//blog by id
router.get('/:id', async (req, res) => {
    try {
        const blogId = req.params.id;

        // Validate blogId as a number
        if (isNaN(blogId)) {
            return res.status(400).json({ error: 'Invalid blog ID' });
        }

        // Fetch blog and its tags
        const [rows] = await pool.query(`
            SELECT 
                b.id, 
                b.title, 
                b.author, 
                b.content, 
                GROUP_CONCAT(t.tag_name) AS tags
            FROM 
                BLOG b
            JOIN 
                BLOG_TAGS bt ON b.id = bt.blog_id
            JOIN 
                TAGS t ON bt.tag_id = t.tag_id
            WHERE 
                b.id = ?
            GROUP BY 
                b.id;
        `, [blogId]);

        if (rows.length === 0) {
            return res.status(404).send('Blog not found');
        }

        const blog = rows[0];

        res.json({
            title: blog.title,
            author: blog.author,
            content: blog.content,
            tags: blog.tags ? blog.tags.split(',') : [], // Convert the comma-separated string into an array
            appId: process.env.CUSDIS_APP_ID
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error: Unable to fetch blog' });
    }
});


router.post('/', authenticateToken, async (req, res) => {
    const { title, author, content, tags } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const userId = req.user.id; // from token

        // Step 1: Insert the blog post
        const [result] = await pool.query(
            'INSERT INTO blog (title, author, content, created_at) VALUES (?, ?, ?, NOW())',
            [title, author, content]
        );
        const blogId = result.insertId;

        if (tags && tags.length > 0) {
            // Step 2: Handle predefined tags
            const querySelectTag = 'SELECT tag_id FROM tags WHERE tag_name = ?';
            const queryInsertBlogTags = 'INSERT INTO blog_tags (blog_id, tag_id) VALUES (?, ?)';

            for (const tagName of tags) {
                // Check if the tag exists in the `tags` table
                const [tagRows] = await pool.query(querySelectTag, [tagName]);
                if (tagRows.length > 0) {
                    const tagId = tagRows[0].tag_id;

                    // Insert into `blog_tags` table
                    await pool.query(queryInsertBlogTags, [blogId, tagId]);
                } else {
                    console.warn(`Tag "${tagName}" not found. Skipping.`);
                }
            }
        }

        res.status(201).json({ message: 'Blog post created successfully', blogId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong during blog submission' });
    }
});

router.delete('/:id',async (req,res) => {

try{
    const blogId = req.params.id;

    if (isNaN(blogId)) {
        return res.status(400).json({error: 'Invalid blog ID'});
    }
    const [result] = await pool.query('DELETE FROM blog WHERE id = ?', [blogId]);

    // Check if the blog existed and was deleted
    if (result.affectedRows === 0) {
        return res.status(404).json({error: 'Blog not found'});
    }

    res.status(200).json({message: 'Blog deleted successfully'});
}
catch(e){
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error: Unable to delete the blog' });
}
});

router.put('/:id',async (req,res)=> {
    try{
        const blogId = req.params.id;
        const { title, content } = req.body;

        const [result] = await pool.query(
            'UPDATE blog SET title = ?, content = ?,updated_at =NOW() WHERE id = ?', [title, content, blogId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog updated successfully' });
    }
    catch (e){
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error: Unable to update the blog' });
    }
})

module.exports = router;