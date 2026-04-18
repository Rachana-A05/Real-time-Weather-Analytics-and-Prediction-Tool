// routes/alerts.js
const express = require('express');
const router = express.Router();
const {
  getExtremeAlerts,
  getAlertStats,
  getThresholds,
  setThresholds,
  getPastAlerts,
  getAlertStatistics,
  getStatewiseAlerts,
  triggerManualCheck
} = require('../controllers/alertsController');

// Default alerts endpoint (returns extreme alerts by default)
router.get('/', getExtremeAlerts);

// Statewise alerts endpoint
router.get('/statewise', getStatewiseAlerts);

// Extreme alerts endpoint
router.get('/extreme', getExtremeAlerts);

// Alert statistics endpoint
router.get('/stats', getAlertStats);

// Past alerts endpoint
router.get('/past', getPastAlerts);

// Alert statistics with filters
router.get('/statistics', getAlertStatistics);

// Thresholds endpoints
router.get('/thresholds', getThresholds);
router.post('/thresholds', setThresholds);
router.post('/check-now', triggerManualCheck);

module.exports = router;
