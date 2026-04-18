const express = require('express');
const router = express.Router();
const AlertModel = require('../models/Alert');
const ApiEvent = require('../models/ApiEvent');

router.get('/stats', async (req, res) => {
  try {
    const alertCount = await AlertModel.countDocuments();
    const sinceMidnight = new Date();
    sinceMidnight.setHours(0, 0, 0, 0);

    const apiCallsToday = await ApiEvent.countDocuments({
      type: 'api_call',
      timestamp: { $gte: sinceMidnight }
    });

    const reportDownloadsToday = await ApiEvent.countDocuments({
      type: 'report_download',
      timestamp: { $gte: sinceMidnight }
    });

    res.json({ alertCount, apiCallsToday, reportDownloadsToday });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
