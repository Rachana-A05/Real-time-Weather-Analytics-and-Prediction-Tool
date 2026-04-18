// alertsController.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { getTimeSeriesBy } = require("../models/alertHistory");
const Alert = require('../models/Alert');
const { updateThresholds: updateMonitorThresholds, getThresholds: getMonitorThresholds, checkWeatherConditions } = require('../services/weatherMonitor');

let lastUpdate = 0;
let cache = [];
let statewiseCache = [];
let statewiseLastUpdate = 0;

const IMD_STATEWISE_URL = "https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning.php";

// Scrape statewise alerts from IMD
async function scrapeStatewiseAlerts() {
  try {
    const resp = await fetch(IMD_STATEWISE_URL);
    const html = await resp.text();
    const $ = cheerio.load(html);
    let alerts = [];

    // IMD typically uses a table with class 'table' or direct table tags
    // Inspect the page to find the correct selector
    $('table tbody tr, table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const state = $(cells[0]).text().trim();
        const warning = $(cells[1]).text().trim();
        
        // Skip header rows or empty rows
        if (state && 
            state !== "State/UT" && 
            state !== "Subdivision" && 
            state !== "Meteorological Sub-Division" &&
            !state.toLowerCase().includes('sub-division')) {
          
          // Determine color based on warning text
          const color = getAlertColor(warning);
          
          alerts.push({
            state,
            warning: warning || "No warning",
            severity: extractSeverity(warning),
            color
          });
        }
      }
    });

    // If no alerts found, add some demo data for testing
    if (alerts.length === 0) {
      console.log("No alerts found from IMD, using demo data");
      alerts = [
        { state: "Tamil Nadu", warning: "Heavy Rain expected", severity: "Orange", color: "#ff6600" },
        { state: "Kerala", warning: "Thunderstorm likely", severity: "Yellow", color: "#ffcc00" },
        { state: "Karnataka", warning: "No warning", severity: "", color: "#90ee90" }
      ];
    }

    console.log(`Scraped ${alerts.length} alerts from IMD`);
    return alerts;
  } catch (e) {
    console.error("Error scraping IMD alerts:", e);
    return [];
  }
}

// Extract severity from warning text
function extractSeverity(warning) {
  const warningLower = warning.toLowerCase();
  if (warningLower.includes('red') || warningLower.includes('extreme')) return "Red";
  if (warningLower.includes('orange') || warningLower.includes('severe')) return "Orange";
  if (warningLower.includes('yellow') || warningLower.includes('heavy')) return "Yellow";
  return "";
}

// Determine alert color based on severity
function getAlertColor(warning) {
  const warningLower = warning.toLowerCase();
  if (warningLower.includes("red") || warningLower.includes("extreme")) return "#ff0000";
  if (warningLower.includes("orange") || warningLower.includes("severe") || warningLower.includes("very heavy")) return "#ff6600";
  if (warningLower.includes("yellow") || warningLower.includes("heavy")) return "#ffcc00";
  if (warningLower.includes("no warning") || warningLower.includes("nil")) return "#90ee90";
  return "#90ee90"; // default green
}

// GET /api/alerts/statewise
exports.getStatewiseAlerts = async (req, res) => {
  const now = Date.now();
  // Cache for 10 minutes
  if (now - statewiseLastUpdate < 10 * 60 * 1000 && statewiseCache.length > 0) {
    return res.json(statewiseCache);
  }
  const alerts = await scrapeStatewiseAlerts();
  statewiseCache = alerts;
  statewiseLastUpdate = now;
  res.json(alerts);
};

// Original extreme alerts endpoint
exports.getExtremeAlerts = async (req, res) => {
  const now = Date.now();
  if (now - lastUpdate < 5 * 60 * 1000 && cache.length > 0) return res.json(cache);
  
  const alerts = await scrapeStatewiseAlerts();
  const extremeAlerts = alerts
    .filter(a => a.color === "#ff0000" || a.color === "#ff6600")
    .map(a => ({
      title: `${a.state}: ${a.warning}`,
      summary: a.warning,
      severity: a.severity,
      location: a.state,
      link: IMD_STATEWISE_URL
    }));
  
  cache = extremeAlerts;
  lastUpdate = now;
  res.json(extremeAlerts);
};

// Alert stats (unchanged)
exports.getAlertStats = (req, res) => {
  const counts = getTimeSeriesBy("Year");
  const years = Object.keys(counts).sort();
  let series = years.map(y => counts[y]);
  const future = [];
  let tmp = [...series];
  for (let i = 0; i < 3; i++) {
    const slice = tmp.slice(-6);
    const prediction = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
    future.push(prediction);
    tmp.push(prediction);
  }
  let nextYear = parseInt(years[years.length - 1]);
  const futureYears = [];
  for (let i = 1; i <= 3; i++) {
    futureYears.push(`${nextYear + i}`);
  }
  res.json({
    years: [...years, ...futureYears],
    counts: [...series, ...future],
    predictions: future
  });
};

// Thresholds
let thresholds = {};
let pastAlerts = [
  { _id: 1, type: 'Temperature', time: '2025-10-31 15:00', message: 'Temp above threshold' }
];


exports.getThresholds = async (req, res) => {
  const thresholds = getMonitorThresholds();
  res.json(thresholds);
};

exports.setThresholds = async (req, res) => {
  const newThresholds = req.body;
  updateMonitorThresholds(newThresholds);
  res.json({ success: true, thresholds: newThresholds });
};


// Get past alerts
exports.getPastAlerts = async (req, res) => {
  try {
    const { limit = 100, city, type } = req.query;
    
    const query = {};
    if (city) query.city = city;
    if (type) query.type = type;
    
    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    const formattedAlerts = alerts.map(alert => ({
      _id: alert._id,
      type: alert.type,
      message: alert.message,
      city: alert.city,
      severity: alert.severity,
      value: alert.value,
      threshold: alert.threshold,
      time: new Date(alert.timestamp).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      timestamp: alert.timestamp,
      resolved: alert.resolved
    }));
    
    res.json(formattedAlerts);
  } catch (error) {
    console.error('Error fetching past alerts:', error);
    res.status(500).json({ error: 'Failed to fetch past alerts' });
  }
};

// Get alert statistics
exports.getAlertStatistics = async (req, res) => {
  try {
    const { startDate, endDate, city } = req.query;
    
    const query = {};
    if (city) query.city = city;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const totalAlerts = await Alert.countDocuments(query);
    const alertsByType = await Alert.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const alertsBySeverity = await Alert.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    
    res.json({
      total: totalAlerts,
      byType: alertsByType,
      bySeverity: alertsBySeverity
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

exports.triggerManualCheck = async (req, res) => {
  try {
    console.log('🔄 Manual weather check triggered by user');
    await checkWeatherConditions();
    
    // Get count of alerts created in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentAlerts = await Alert.countDocuments({
      timestamp: { $gte: oneMinuteAgo }
    });
    
    res.json({ 
      success: true, 
      message: `Weather check completed. ${recentAlerts} new alert(s) created.`,
      alertsCreated: recentAlerts
    });
  } catch (error) {
    console.error('Error in manual check:', error);
    res.status(500).json({ error: 'Failed to check weather conditions' });
  }
};