const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Real-time predictions from MongoDB
router.get('/predictions', analyticsController.getPredictions);

// Alert distributions
router.get('/type-distribution', analyticsController.getAlertTypeDistribution);
router.get('/city-distribution', analyticsController.getAlertCityDistribution);

// Trends and patterns
router.get('/recent-trends', analyticsController.getRecentTrends);
router.get('/hourly-pattern', analyticsController.getHourlyPattern);

// Statistics
router.get('/stats-summary', analyticsController.getStatsSummary);

// Comprehensive dashboard
router.get('/dashboard', analyticsController.getDashboard);

module.exports = router;
