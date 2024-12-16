const express = require('express');
const router = express.Router();
const pool = require("../db");

router.get('/', async (req, res) => {
    try {
        const currDate = new Date();
        const currDateOnly = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate());

        const[rows] = await pool.query('SELECT * FROM word_of_day WHERE word_date =?', currDateOnly);

        if(rows.length === 0) {
            res.status(404).json({error:'No words were found'});
        }

        if(rows.length >0){
            if(rows[0].word_date < currDateOnly){
                res.status(404).json({error: 'sql date is before current date.'})
            }
            else if(rows[0].word_date > currDateOnly){
                res.status(404).json({error:'current date is before sql date.'})
            }
            else{
                res.json({
                    "word": rows[0].word,
                    "definition": rows[0].definition,
                    "word_date": rows[0].word_date
                })
            }
        }

    } catch (error) {
        console.error("Error processing Gemini API response:", error);
        res.status(500).json({ error: "Failed to fetch word of the day" });
    }
})


module.exports = router;