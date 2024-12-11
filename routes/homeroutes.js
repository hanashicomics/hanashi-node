const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const name = 'Ethan'
    res.render('index', { name: name });
})

module.exports = router;