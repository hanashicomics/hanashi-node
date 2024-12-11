const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

router.get('/', async (req, res) =>{
   try{
       const[rows] = await pool.query('SELECT * FROM blog');
       res.json(rows);
   }
   catch (e){
       console.error(e);
       res.status(404).json({error:'Something went wrong with fetching blogs'})
   }
});

//blog by id
router.get('/:id', async (req, res) => {
    try{
        const blogId = req.params.id;
        const[rows] = await pool.query('SELECT * FROM blog where id = ?', blogId);

        if(rows.length == 0){
            return res.status(404).send('blog not Found');
        }
        //invalid userid number
        if (isNaN(blogId)) {
            return res.status(400).json({ error: 'Invalid blog ID' });
        }

        const appId = process.env.CUSDIS_APP_ID
        // Construct the blog HTML content
        const blogHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<article>
    <h1>${rows[0].title}</h1>
    <p>${rows[0].content}</p>
</article>
<div id="cusdis_thread"
     data-host="https://cusdis.com"
     data-app-id="${appId}"
     data-page-id="${blogId}"
     data-page-title="${rows[0].title}"
     data-page-url="${req.protocol}://${req.get('host')}${req.originalUrl}">
</div>
<script src="https://cusdis.com/js/cusdis.es.js"></script>
</body>
</html>
    `;
        res.send(blogHtml);
    }
    catch(e){
        console.error(e);
        res.status(500).json({error: 'Internal Server Error: Unable to fetch'});
    }
})

router.post('/',authenticateToken, async (req, res) => {
    const { title,author, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try{
        const userId = req.user.id; //from token

        const [result] = await pool.query(
            'INSERT INTO blog (title,author, content, created_at) VALUES (?, ?, ?, NOW())',
            [title,author, content]
        );
        res.status(201).json({ message: 'Blog post created successfully', blogId: result.insertId });
    }
    catch (e){
        console.error(e);
        res.status(500).json({ error: 'Something went wrong during bolg submission' });
    }
})

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