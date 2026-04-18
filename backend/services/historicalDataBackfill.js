const axios = require('axios');
const Alert = require('../models/Alert');


class HistoricalDataBackfill {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.cities = [
      { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, state: 'Telangana' },
      { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
      { name: 'Pune', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
      { name: 'Jaipur', lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
      { name: 'Lucknow', lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' }
    ];
    // Default thresholds (can be customized)
    this.thresholds = {
      temperature: 40, // °C
      wind: 60, // km/h
      humidity: 90, // %
      pressure: 980, // hPa
      aqi: 200 // AQI value
    };
  }

  async fetchHistoricalWeather(lat, lon, timestamp) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/onecall/timemachine`;
      const response = await axios.get(url, {
        params: {
          lat,
          lon,
          dt: timestamp,
          appid: this.apiKey,
          units: 'metric'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching historical weather for ${lat},${lon}:`, error.message);
      return null;
    }
  }

  analyzeWeatherData(weatherData, cityName, state) {
    if (!weatherData || !weatherData.current) return [];
    const alerts = [];
    const current = weatherData.current;
    const temp = current.temp;
    const windSpeed = (current.wind_speed * 3.6);
    const humidity = current.humidity;
    const pressure = current.pressure;
    const ts = new Date(current.dt * 1000);

    // Only allowed enum values below!

    // Temperature
    if (temp > this.thresholds.temperature) {
      alerts.push({
        city: cityName,
        type: 'Temperature',
        severity: temp > 45 ? 'High' : 'Low',
        value: temp,
        threshold: this.thresholds.temperature,
        message: `High temperature alert: ${temp.toFixed(1)}°C exceeds threshold of ${this.thresholds.temperature}°C`,
        timestamp: ts,
        resolved: false
      });
    }

    // Wind
    if (windSpeed > this.thresholds.wind) {
      alerts.push({
        city: cityName,
        type: 'Wind',
        severity: windSpeed > 80 ? 'High' : 'Low',
        value: windSpeed,
        threshold: this.thresholds.wind,
        message: `High wind speed alert: ${windSpeed.toFixed(1)} km/h exceeds threshold of ${this.thresholds.wind} km/h`,
        timestamp: ts,
        resolved: false
      });
    }

    // Humidity
    if (humidity > this.thresholds.humidity) {
      alerts.push({
        city: cityName,
        type: 'Humidity',
        severity: 'Low',
        value: humidity,
        threshold: this.thresholds.humidity,
        message: `High humidity alert: ${humidity}% exceeds threshold of ${this.thresholds.humidity}%`,
        timestamp: ts,
        resolved: false
      });
    }

    // Pressure
    if (pressure < this.thresholds.pressure) {
      alerts.push({
        city: cityName,
        type: 'Pressure',
        severity: pressure < 960 ? 'Critical' : 'Low',
        value: pressure,
        threshold: this.thresholds.pressure,
        message: `Low pressure alert: Pressure ${pressure} hPa below threshold of ${this.thresholds.pressure} hPa`,
        timestamp: ts,
        resolved: false
      });
    }

    return alerts;
  }

  generateHistoricalTimestamps(monthsBack = 12) {
    const timestamps = [];
    const now = new Date();
    for (let monthOffset = 1; monthOffset <= monthsBack; monthOffset++) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - monthOffset);
      [1, 10, 20].forEach(day => {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0);
        timestamps.push(Math.floor(date.getTime() / 1000));
      });
    }
    return timestamps;
  }

  async backfillHistoricalData(monthsBack = 12) {
    console.log(`Starting historical data backfill for ${monthsBack} months...`);
    const timestamps = this.generateHistoricalTimestamps(monthsBack);
    const allAlerts = [];
    let apiCalls = 0, successfulCalls = 0, errors = 0;

    for (const city of this.cities) {
      for (const timestamp of timestamps) {
        apiCalls++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        const weatherData = await this.fetchHistoricalWeather(city.lat, city.lon, timestamp);
        if (weatherData) {
          successfulCalls++;
          const alerts = this.analyzeWeatherData(weatherData, city.name, city.state);
          allAlerts.push(...alerts);
        } else {
          errors++;
        }
      }
    }

    // Remove duplicates based on city, type, and timestamp (same day)
    const uniqueAlerts = this.removeDuplicateAlerts(allAlerts);
    let insertedCount = 0;
    if (uniqueAlerts.length > 0) {
      try {
        const result = await Alert.insertMany(uniqueAlerts, { ordered: false });
        insertedCount = result.length;
        console.log(`Successfully inserted ${insertedCount} historical alerts`);
      } catch (error) {
        if (error.code === 11000) {
          insertedCount = error.result ? error.result.nInserted : 0;
          console.log(`Inserted ${insertedCount} alerts (some duplicates skipped)`);
        } else {
          console.error('Error inserting alerts:', error.message);
        }
      }
    }

    const summary = {
      success: true,
      monthsProcessed: monthsBack,
      citiesProcessed: this.cities.length,
      timestampsProcessed: timestamps.length,
      totalApiCalls: apiCalls,
      successfulApiCalls: successfulCalls,
      failedApiCalls: errors,
      alertsGenerated: allAlerts.length,
      alertsInserted: insertedCount,
      processingTime: `${apiCalls} seconds (approximate)`
    };
    console.log('Backfill completed:', summary);
    return summary;
  }

  removeDuplicateAlerts(alerts) {
    const seen = new Set();
    return alerts.filter(alert => {
      const key = `${alert.city}-${alert.type}-${alert.timestamp.toISOString().split('T')[0]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getBackfillStatus() {
    try {
      const oldestAlert = await Alert.findOne().sort({ timestamp: 1 });
      const newestAlert = await Alert.findOne().sort({ timestamp: -1 });
      const totalAlerts = await Alert.countDocuments();
      let monthsOfData = 0;
      if (oldestAlert && newestAlert) {
        const diffMs = newestAlert.timestamp - oldestAlert.timestamp;
        monthsOfData = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      }
      return {
        totalAlerts,
        oldestAlert: oldestAlert ? oldestAlert.timestamp : null,
        newestAlert: newestAlert ? newestAlert.timestamp : null,
        monthsOfData,
        needsBackfill: monthsOfData < 6
      };
    } catch (error) {
      console.error('Error getting backfill status:', error.message);
      return { error: error.message };
    }
  }

  // *** Added function for dummy monthly alerts (your requested block) ***
  async insertDummyMonthlyAlerts() {
    // Month format "YYYY-MM"
    const monthlyAlerts = {
      "2024-12": 42,
      "2025-01": 46,
      "2025-02": 48,
      "2025-03": 39,
      "2025-04": 51,
      "2025-05": 62,
      "2025-06": 73,
      "2025-07": 80,
      "2025-08": 78,
      "2025-09": 63,
      "2025-10": 55,
      "2025-11": 65
    };

    let inserted = 0;
    for (const [month, count] of Object.entries(monthlyAlerts)) {
      for (let i = 0; i < count; i++) {
        const date = new Date(`${month}-15T12:00:00Z`);
        const dummyAlert = {
          city: "DemoCity",
          type: "Historical",
          severity: "Low",
          value: 1,
          threshold: 0,
          message: `Demo alert for month ${month}`,
          timestamp: date,
          resolved: true
        };
        try {
          await Alert.create(dummyAlert);
          inserted++;
        } catch (err) {
          // ignore duplicate key errors or log others
        }
      }
    }
    console.log(`Inserted ${inserted} dummy monthly alerts!`);
    return inserted;
  }
}

module.exports = new HistoricalDataBackfill();
