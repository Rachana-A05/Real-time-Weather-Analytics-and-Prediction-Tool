// backend/routes/weather.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = 'ef851b5c005c4f70f5f3d000496fb200';

// GET current weather for a city (saves history)
router.get('/current/:city', async (req, res) => {
    const city = req.params.city;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    try {
        const result = await fetch(url).then(r => r.json());

        // Defensive: Only serve minimized, expected structure
        if (result && result.main && result.weather && Array.isArray(result.weather) && result.weather[0]) {
            const data = {
                city: result.name,
                temperature: result.main.temp,
                description: result.weather[0].description,
                main: result.weather[0].main,
                humidity: result.main.humidity,
                windspeed: result.wind && result.wind.speed
            };
            // Save history
            const row = `${Date.now()},${city},${result.main.temp},${result.weather[0].main}\n`;
            fs.appendFileSync('weather_history.csv', row);

            res.json(data);
        } else {
            res.status(404).json({ error: "City not found or no weather data." });
        }
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// GET forecast for a city
router.get('/forecast/:city', async (req, res) => {
    const city = req.params.city;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    try {
        const result = await fetch(url).then(r => r.json());
        if (result && Array.isArray(result.list)) {
            const forecast = result.list.map(e => ({
                date: e.dt_txt,
                temperature: e.main && e.main.temp,
                description: e.weather && e.weather[0] && e.weather[0].description,
                main: e.weather && e.weather[0] && e.weather[0].main,
                icon: e.weather && e.weather[0] && e.weather[0].icon,
            })).slice(0, 8); // limit to next ~24 hours (8 x 3h)
            res.json({ forecast });
        } else {
            res.status(404).json({ error: "Forecast not found." });
        }
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// Get historical records for a city
router.get('/history/:city', (req, res) => {
    const city = req.params.city;
    try {
        const data = fs.readFileSync('weather_history.csv', 'utf-8')
            .split('\n')
            .filter(line => line.includes(city));
        res.json({ history: data });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

module.exports = router;
