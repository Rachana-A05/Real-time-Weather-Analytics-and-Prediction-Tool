const express = require('express');
const router = express.Router();
const AlertModel = require('../models/Alert');
const ApiEvent = require('../models/ApiEvent');
const https = require('https');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // Total alerts count (these are your weather alerts, not API calls)
    const totalAlerts = await AlertModel.countDocuments();
    
    // High severity alerts
    const highAlerts = await AlertModel.countDocuments({ 
      severity: { $in: ['High', 'Critical'] } 
    });

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // FIXED: Only count actual weather API calls (not internal requests)
    const apiCallsToday = await ApiEvent.countDocuments({
      type: 'weather_api_call',
      timestamp: { $gte: todayStart }
    });

    // Report downloads today
    const reportDownloadsToday = await ApiEvent.countDocuments({
      type: 'report_download',
      timestamp: { $gte: todayStart }
    });

    res.json({
      totalReports: totalAlerts,
      highAlerts,
      apiCallsToday,
      reportDownloadsToday
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/logDownload
router.post('/logDownload', async (req, res) => {
  try {
    await ApiEvent.create({ 
      type: 'report_download',
      timestamp: new Date()
    });
    res.json({ message: 'Report download logged' });
  } catch (err) {
    console.error('Log download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/weather-trends
router.get('/weather-trends', async (req, res) => {
  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY || 'ba38990e1b2d43fd2d84bb5094606897';
    
    if (!API_KEY) {
      return res.status(400).json({ 
        success: false, 
        message: 'OpenWeather API key not configured' 
      });
    }

    const city = 'Bangalore';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    console.log('Fetching weather trends from OpenWeather...');

    // LOG THIS API CALL
    await ApiEvent.create({
      type: 'weather_api_call',
      service: 'openweathermap',
      endpoint: '/forecast',
      city: city,
      timestamp: new Date(),
      success: true
    });

    const weatherData = await new Promise((resolve, reject) => {
      https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });
        resp.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    if (!weatherData || !Array.isArray(weatherData.list)) {
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid forecast data from OpenWeather' 
      });
    }

    // Aggregate data by day
    const dailyData = {};
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    weatherData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayName = daysOfWeek[date.getDay()];
      
      if (!dailyData[dayName]) {
        dailyData[dayName] = {
          day: dayName,
          tempSum: 0,
          precipSum: 0,
          count: 0
        };
      }
      
      dailyData[dayName].tempSum += item.main?.temp || 0;
      const rainVolume = item.rain?.['3h'] || 0;
      const snowVolume = item.snow?.['3h'] || 0;
      dailyData[dayName].precipSum += (rainVolume + snowVolume);
      dailyData[dayName].count += 1;
    });

    const weeklyData = Object.values(dailyData).map(day => {
      const avgTemp = day.count > 0 ? Number((day.tempSum / day.count).toFixed(1)) : 0;
      const avgPrecip = day.count > 0 ? Number((day.precipSum / day.count * 10).toFixed(1)) : 0;
      
      return {
        day: day.day,
        temperature: avgTemp,
        precipitation: avgPrecip
      };
    });

    const today = new Date().getDay();
    const sortedData = weeklyData.sort((a, b) => {
      const aIndex = (daysOfWeek.indexOf(a.day) - today + 7) % 7;
      const bIndex = (daysOfWeek.indexOf(b.day) - today + 7) % 7;
      return aIndex - bIndex;
    });

    console.log('Weather trends processed:', sortedData.length, 'days');
    res.json(sortedData);
    
  } catch (error) {
    console.error('Error fetching weather trends:', error);
    
    // Log failed API call
    await ApiEvent.create({
      type: 'weather_api_call',
      service: 'openweathermap',
      endpoint: '/forecast',
      timestamp: new Date(),
      success: false
    }).catch(err => console.error('Failed to log API error:', err));
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch weather trends' 
    });
  }
});

module.exports = router;
