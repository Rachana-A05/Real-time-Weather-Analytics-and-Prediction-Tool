const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

dotenv.config();
const router = express.Router();

// CSV file path
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "aqi_history.csv");

// Ensure data directory and file exist
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "city,aqi,numericAQI,category,mainPollutant,time\n", "utf8");
}

// Helper: fetch AQI from OpenWeather and append to CSV
router.get("/", async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ status: "error", data: "City is required" });

  try {
    // Normalize city name (first letter capital)
    const cityNormalized = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    // Make sure ENV key is set
    const API_KEY = process.env.WEATHER_API_KEY;
    if (!API_KEY) throw new Error("API Key missing in .env");

    // Get lat/lon
    const geoRes = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityNormalized)}&limit=1&appid=${API_KEY}`
    );
    if (!geoRes.data.length) throw new Error("City not found");

    const { lat, lon } = geoRes.data[0];

    // Get air pollution
    const aqiRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (!aqiRes.data.list || !aqiRes.data.list.length) throw new Error("No AQI data returned");

    const aqiIndex = aqiRes.data.list[0].main.aqi; // 1–5 scale
    const numericAQI = aqiIndex * 50;              // scaled 0–250
    const categories = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
    const category = categories[aqiIndex] || "Unknown";
    const mainPollutant = Object.keys(aqiRes.data.list[0].components || {})[0] || "Unknown";
    const time = new Date().toISOString();

    // Append to CSV
    const row = `${cityNormalized},${aqiIndex},${numericAQI},${category},${mainPollutant},${time}\n`;
    fs.appendFileSync(DATA_FILE, row, "utf8");

    // Return response (for dashboard)
    res.json({
      city: cityNormalized,
      aqi: aqiIndex,
      numericAQI,
      category,
      mainPollutant,
      time,
      components: aqiRes.data.list[0].components || {},
    });
  } catch (err) {
    console.error("AQI error:", err && (err.response?.data || err.message || err));
    res.status(500).json({ status: "error", data: "Failed to fetch AQI data" });
  }
});

// History endpoint: return last 10 records
router.get("/history", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.json([]);

  const results = [];
  fs.createReadStream(DATA_FILE)
    .pipe(csv())
    .on("data", (data) => {
      results.push({
        city: data.city,
        numericAQI: Number(data.numericAQI),
        category: data.category,
        time: data.time,
      });
    })
    .on("end", () => {
      // Return last 10 records (newest last)
      res.json(results.slice(-10));
    })
    .on("error", (err) => {
      console.error("CSV read error:", err);
      res.status(500).json({ status: "error", data: "Failed to read history file" });
    });
});

module.exports = router;
