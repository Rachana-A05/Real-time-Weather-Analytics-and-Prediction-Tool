const weatherPredictor = require('../services/weatherPredictor');

/**
 * Get real-time predictions from MongoDB alerts ONLY
 */
exports.getPredictions = async (req, res) => {
  try {
    const { method = 'holt-winters', months = 36 } = req.query;
    
    console.log(`Generating ${method} predictions for ${months} months...`);
    
    const predictions = await weatherPredictor.generatePredictions(
      method,
      parseInt(months)
    );

    res.json({
      success: true,
      data: predictions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictions',
      error: error.message
    });
  }
};

/**
 * Get alert type distribution (real-time)
 */
exports.getAlertTypeDistribution = async (req, res) => {
  try {
    const distribution = await weatherPredictor.getAlertTypeDistribution();

    res.json({
      success: true,
      data: distribution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting alert type distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alert type distribution',
      error: error.message
    });
  }
};

/**
 * Get alert city distribution (real-time)
 */
exports.getAlertCityDistribution = async (req, res) => {
  try {
    const distribution = await weatherPredictor.getAlertCityDistribution();

    res.json({
      success: true,
      data: distribution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting alert city distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alert city distribution',
      error: error.message
    });
  }
};

/**
 * Get recent alert trends (last 30 days)
 */
exports.getRecentTrends = async (req, res) => {
  try {
    const trends = await weatherPredictor.getRecentTrends();

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recent trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent trends',
      error: error.message
    });
  }
};

/**
 * Get hourly alert pattern for today
 */
exports.getHourlyPattern = async (req, res) => {
  try {
    const pattern = await weatherPredictor.getHourlyPattern();

    res.json({
      success: true,
      data: pattern,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting hourly pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hourly pattern',
      error: error.message
    });
  }
};

/**
 * Get statistics summary
 */
exports.getStatsSummary = async (req, res) => {
  try {
    const stats = await weatherPredictor.getStatsSummary();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting stats summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats summary',
      error: error.message
    });
  }
};

/**
 * Get comprehensive real-time dashboard data
 */
exports.getDashboard = async (req, res) => {
  try {
    console.log('Fetching comprehensive dashboard data...');
    
    const [predictions, typeDistribution, cityDistribution, recentTrends, statsSummary] = await Promise.all([
      weatherPredictor.generatePredictions('holt-winters', 36),
      weatherPredictor.getAlertTypeDistribution(),
      weatherPredictor.getAlertCityDistribution(),
      weatherPredictor.getRecentTrends(),
      weatherPredictor.getStatsSummary()
    ]);

    res.json({
      success: true,
      data: {
        predictions,
        typeDistribution,
        cityDistribution,
        recentTrends,
        stats: statsSummary
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};
