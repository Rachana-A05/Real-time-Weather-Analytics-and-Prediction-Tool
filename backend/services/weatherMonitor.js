const axios = require('axios');
const Alert = require('../models/Alert');

// Major Indian cities to monitor
const CITIES_TO_MONITOR = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 }
];

// Default thresholds (you can modify these)
const DEFAULT_THRESHOLDS = {
  temperature: { max: 42, min: 8 },        // Max 42°C (severe heat), Min 8°C (unusual cold)
  wind: { max: 40 },                       // Max 40 km/h (heavy winds, storms)
  humidity: { max: 95, min: 10 },          // Max 95% (extreme humidity), Min 10% (very dry)
  pressure: { max: 1035, min: 975 }        // Typical range, triggers only on strong weather events
};


let currentThresholds = { ...DEFAULT_THRESHOLDS };

// Update thresholds from controller
function updateThresholds(newThresholds) {
  currentThresholds = { ...DEFAULT_THRESHOLDS, ...newThresholds };
  console.log('📊 Thresholds updated:', currentThresholds);
}

// Get thresholds
function getThresholds() {
  return currentThresholds;
}

// Check weather and create alerts
async function checkWeatherConditions() {
  console.log('🔍 Checking weather conditions at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  const API_KEY = process.env.WEATHER_API_KEY;
  if (!API_KEY) {
    console.error('❌ WEATHER_API_KEY not configured');
    return;
  }

  let alertsCreated = 0;

  for (const city of CITIES_TO_MONITOR) {
    try {
      // Fetch current weather
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: city.lat,
          lon: city.lon,
          appid: API_KEY,
          units: 'metric'
        }
      });

      const data = response.data;
      const temp = data.main.temp;
      const humidity = data.main.humidity;
      const pressure = data.main.pressure;
      const windSpeed = data.wind.speed * 3.6; // Convert m/s to km/h

      // Check temperature thresholds
      if (temp > currentThresholds.temperature.max) {
        await createAlert({
          type: 'Temperature',
          city: city.name,
          severity: 'High',
          value: temp,
          threshold: currentThresholds.temperature.max,
          message: `High temperature alert: ${temp.toFixed(1)}°C exceeds threshold of ${currentThresholds.temperature.max}°C`
        });
        alertsCreated++;
      } else if (temp < currentThresholds.temperature.min) {
        await createAlert({
          type: 'Temperature',
          city: city.name,
          severity: 'Low',
          value: temp,
          threshold: currentThresholds.temperature.min,
          message: `Low temperature alert: ${temp.toFixed(1)}°C is below threshold of ${currentThresholds.temperature.min}°C`
        });
        alertsCreated++;
      }

      // Check wind speed
      if (windSpeed > currentThresholds.wind.max) {
        await createAlert({
          type: 'Wind',
          city: city.name,
          severity: 'High',
          value: windSpeed,
          threshold: currentThresholds.wind.max,
          message: `High wind speed alert: ${windSpeed.toFixed(1)} km/h exceeds threshold of ${currentThresholds.wind.max} km/h`
        });
        alertsCreated++;
      }

      // Check humidity
      if (humidity > currentThresholds.humidity.max) {
        await createAlert({
          type: 'Humidity',
          city: city.name,
          severity: 'High',
          value: humidity,
          threshold: currentThresholds.humidity.max,
          message: `High humidity alert: ${humidity}% exceeds threshold of ${currentThresholds.humidity.max}%`
        });
        alertsCreated++;
      } else if (humidity < currentThresholds.humidity.min) {
        await createAlert({
          type: 'Humidity',
          city: city.name,
          severity: 'Low',
          value: humidity,
          threshold: currentThresholds.humidity.min,
          message: `Low humidity alert: ${humidity}% is below threshold of ${currentThresholds.humidity.min}%`
        });
        alertsCreated++;
      }

      // Check pressure
      if (pressure > currentThresholds.pressure.max) {
        await createAlert({
          type: 'Pressure',
          city: city.name,
          severity: 'High',
          value: pressure,
          threshold: currentThresholds.pressure.max,
          message: `High pressure alert: ${pressure} hPa exceeds threshold of ${currentThresholds.pressure.max} hPa`
        });
        alertsCreated++;
      } else if (pressure < currentThresholds.pressure.min) {
        await createAlert({
          type: 'Pressure',
          city: city.name,
          severity: 'Low',
          value: pressure,
          threshold: currentThresholds.pressure.min,
          message: `Low pressure alert: ${pressure} hPa is below threshold of ${currentThresholds.pressure.min} hPa`
        });
        alertsCreated++;
      }

    } catch (error) {
      console.error(`❌ Error checking weather for ${city.name}:`, error.message);
    }
  }

  if (alertsCreated > 0) {
    console.log(`✅ Created ${alertsCreated} new alerts`);
  } else {
    console.log('✓ No threshold violations detected');
  }
}

// Create alert in database
async function createAlert(alertData) {
  try {
    // Check if similar alert exists in last hour (avoid duplicates)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingAlert = await Alert.findOne({
      city: alertData.city,
      type: alertData.type,
      severity: alertData.severity,
      timestamp: { $gte: oneHourAgo }
    });

    if (existingAlert) {
      console.log(`⏭️  Skipping duplicate alert for ${alertData.city} - ${alertData.type}`);
      return null;
    }

    // Create new alert
    const alert = new Alert({
      ...alertData,
      timestamp: new Date(),
      resolved: false
    });

    await alert.save();
    console.log(`🚨 Alert created: ${alertData.city} - ${alertData.type} (${alertData.severity})`);
    return alert;
  } catch (error) {
    console.error('❌ Error creating alert:', error);
    return null;
  }
}

// Start monitoring (runs every 10 minutes)
function startMonitoring() {
  console.log('🚀 Starting weather monitoring service...');
  console.log('📋 Monitoring cities:', CITIES_TO_MONITOR.map(c => c.name).join(', '));
  console.log('⏰ Check interval: Every 10 minutes');
  
  // Run immediately on start
  checkWeatherConditions();
  
  // Then run every 10 minutes
  const interval = setInterval(checkWeatherConditions, 10 * 60 * 1000);
  
  return interval;
}

module.exports = {
  startMonitoring,
  updateThresholds,
  getThresholds,
  checkWeatherConditions
};
