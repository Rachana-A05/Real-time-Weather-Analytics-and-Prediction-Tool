const Alert = require('../models/Alert');

class WeatherPredictor {
  // Exponential Smoothing
  exponentialSmoothing(data, alpha = 0.3, steps = 36) {
    if (data.length === 0) return Array(steps).fill(0);
    
    const smoothed = [data[0]];
    for (let i = 1; i < data.length; i++) {
      smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
    }
    
    const predictions = [];
    let lastSmoothed = smoothed[smoothed.length - 1];
    
    for (let i = 0; i < steps; i++) {
      predictions.push(Math.max(0, Math.round(lastSmoothed)));
    }
    
    return predictions;
  }

  // Linear Regression Trend
  calculateTrend(data) {
    const n = data.length;
    if (n === 0) return { slope: 0, intercept: 0 };
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  // Holt-Winters (Trend) Prediction - FIXED
  holtWinters(data, alpha = 0.3, beta = 0.1, steps = 36) {
    console.log('=== HOLT-WINTERS DEBUG ===');
    console.log('Input data:', data);
    console.log('Steps requested:', steps);
    
    if (data.length === 0) {
      console.log('No data, returning zeros');
      return Array(steps).fill(0);
    }
    
    if (data.length < 2) {
      console.log('Only 1 data point, using flat prediction');
      return Array(steps).fill(Math.round(data[0]));
    }
    
    let level = data[0];
    let trend = data[1] - data[0];
    
    console.log('Initial level:', level);
    console.log('Initial trend:', trend);
    
    // Learn from historical data
    for (let i = 1; i < data.length; i++) {
      const lastLevel = level;
      level = alpha * data[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
    }
    
    console.log('Final level after training:', level);
    console.log('Final trend after training:', trend);
    
    // Generate forecasts for all future steps
    const forecasts = [];
    for (let i = 1; i <= steps; i++) {
      let value = level + i * trend;
      // Ensure valid, non-negative predictions
      let finalValue = Math.max(0, Math.round(value));
      forecasts.push(finalValue);
    }
    
    console.log(`Holt-Winters: Generated ${forecasts.length} predictions`);
    console.log('First 10 predictions:', forecasts.slice(0, 10));
    console.log('Last 10 predictions:', forecasts.slice(-10));
    console.log('Min prediction:', Math.min(...forecasts));
    console.log('Max prediction:', Math.max(...forecasts));
    console.log('=========================');
    
    return forecasts;
  }

  // Historical Data by Month
  async getHistoricalAlertData(groupBy = 'month', lookbackMonths = 24) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

    const pipeline = [
      { $match: { createdAt: { $gte: cutoffDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];

    const results = await Alert.aggregate(pipeline);

    const periods = results.map(
      r => `${r._id.year}-${String(r._id.month).padStart(2, '0')}`
    );
    const counts = results.map(r => r.count);

    console.log('Historical Data Retrieved:');
    console.log('Periods:', periods);
    console.log('Counts:', counts);

    return {
      periods,
      counts,
      totalAlerts: counts.reduce((a, b) => a + b, 0),
      dataPoints: periods.length,
    };
  }

  // Main Prediction Endpoint - FIXED
  async generatePredictions(method = 'holt-winters', forecastMonths = 36) {
    const historicalData = await this.getHistoricalAlertData('month', 24);

    if (historicalData.counts.length === 0) {
      return {
        historical: { periods: [], counts: [] },
        predictions: { periods: [], values: [] },
        method: method,
        confidence: 'none',
        dataSource: 'realtime',
        totalAlerts: 0,
        dataPoints: 0,
        message: 'No alerts collected yet. Predictions will appear once sufficient data is collected.'
      };
    }

    // Generate predictions using selected method
    let rawPredictions;
    if (method === 'exponential-smoothing') {
      rawPredictions = this.exponentialSmoothing(historicalData.counts, 0.3, forecastMonths);
    } else {
      rawPredictions = this.holtWinters(historicalData.counts, 0.3, 0.1, forecastMonths);
    }

    // Ensure all predictions are valid numbers
    const predictions = rawPredictions.map(val => {
      if (typeof val !== 'number' || !isFinite(val)) return 0;
      return Math.max(0, Math.round(val));
    });

    console.log(`Total predictions generated: ${predictions.length}`);

    // Generate future period labels
    const lastPeriod = historicalData.periods[historicalData.periods.length - 1];
    const [lastYear, lastMonth] = lastPeriod.split('-').map(Number);
    
    const futurePeriods = [];
    for (let i = 1; i <= forecastMonths; i++) {
      const futureMonth = ((lastMonth + i - 1) % 12) + 1;
      const futureYear = lastYear + Math.floor((lastMonth + i - 1) / 12);
      futurePeriods.push(`${futureYear}-${String(futureMonth).padStart(2, "0")}`);
    }

    console.log('Future Periods Generated:', futurePeriods.length);
    console.log('First future period:', futurePeriods[0]);
    console.log('Last future period:', futurePeriods[futurePeriods.length - 1]);

    // Determine confidence level
    let confidence;
    if (historicalData.dataPoints >= 12) {
      confidence = 'high';
    } else if (historicalData.dataPoints >= 6) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    const result = {
      historical: {
        periods: historicalData.periods,
        counts: historicalData.counts
      },
      predictions: {
        periods: futurePeriods,
        values: predictions
      },
      method: method,
      confidence: confidence,
      dataSource: 'realtime',
      totalAlerts: historicalData.totalAlerts,
      dataPoints: historicalData.dataPoints,
      message: confidence === 'low'
        ? `Predictions are based on ${historicalData.dataPoints} months of real-time data. Confidence will improve as more data is collected.`
        : `Predictions generated with ${historicalData.dataPoints} months of real alert data.`
    };

    console.log('Final result structure:', {
      historicalPeriods: result.historical.periods.length,
      historicalCounts: result.historical.counts.length,
      predictionPeriods: result.predictions.periods.length,
      predictionValues: result.predictions.values.length
    });

    return result;
  }

  // Alert Type Distribution
  async getAlertTypeDistribution() {
    const distribution = await Alert.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    return distribution.map(item => ({
      type: item._id,
      count: item.count
    }));
  }

  // Alert City Distribution
  async getAlertCityDistribution() {
    const distribution = await Alert.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    return distribution.map(item => ({
      city: item._id,
      count: item.count
    }));
  }

  // 30-day Daily Alert Trends
  async getRecentTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAlerts = await Alert.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Group by day
    const dailyCount = {};
    recentAlerts.forEach(alert => {
      const date = new Date(alert.createdAt).toISOString().split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    const days = Object.keys(dailyCount).sort();
    const counts = days.map(day => dailyCount[day]);
    const trend = this.calculateTrend(counts);
    const trendDirection = trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable';

    return {
      days, 
      counts,
      totalAlerts: recentAlerts.length,
      averagePerDay: days.length ? (recentAlerts.length / days.length).toFixed(2) : 0,
      trend: trendDirection,
      trendValue: trend.slope.toFixed(3),
      daysWithData: days.length
    };
  }

  // Today's Hourly Pattern
  async getHourlyPattern() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAlerts = await Alert.find({
      createdAt: { $gte: today }
    });

    const hourly = {};
    for (let i = 0; i < 24; i++) hourly[i] = 0;

    todayAlerts.forEach(alert => {
      const hour = new Date(alert.createdAt).getHours();
      hourly[hour]++;
    });

    return {
      hours: Object.keys(hourly).map(Number),
      counts: Object.values(hourly),
      totalToday: todayAlerts.length
    };
  }

  // Full Stats Summary
  async getStatsSummary() {
    const totalAlerts = await Alert.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAlerts = await Alert.countDocuments({ createdAt: { $gte: today } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekAlerts = await Alert.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthAlerts = await Alert.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    const latestAlert = await Alert.findOne().sort({ createdAt: -1 });

    return {
      total: totalAlerts,
      today: todayAlerts,
      last7Days: weekAlerts,
      last30Days: monthAlerts,
      latestAlert: latestAlert ? {
        city: latestAlert.city,
        type: latestAlert.type,
        message: latestAlert.message,
        createdAt: latestAlert.createdAt
      } : null
    };
  }
}

module.exports = new WeatherPredictor();