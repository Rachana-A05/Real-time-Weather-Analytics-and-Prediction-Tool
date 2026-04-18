// backend/routes/predict.js
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

router.get('/:city', (req, res) => {
    exec(`python backend/weather_predict.py ${req.params.city}`, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: stderr });
        try {
            res.json(JSON.parse(stdout));
        } catch(e) {
            res.status(500).json({ error: 'Python output error' });
        }
    });
});

module.exports = router;
