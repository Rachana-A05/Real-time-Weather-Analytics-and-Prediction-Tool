// routes/admin.js
const express = require('express');
const router = express.Router();

const adminModule = require('../admin.js');

// API keys
router.post('/apikey', adminModule.saveAPIKey);
router.get('/apikey', adminModule.getAPIKey);

// Export report
router.get('/export', adminModule.exportReport);

// Roles management
router.get('/roles', adminModule.getRoles);
router.post('/roles/create', adminModule.createRole);
router.post('/roles/update', adminModule.updateRole);
router.delete('/roles/:id', adminModule.deleteRole);

// Settings
router.get('/settings', adminModule.getSettings);
router.post('/settings/update', adminModule.updateSettings);

// Dashboard and weather trends
router.get('/stats', adminModule.getDashboardStats);
router.get('/trends', adminModule.getWeatherTrends);

// Export the router as module
module.exports = router;
