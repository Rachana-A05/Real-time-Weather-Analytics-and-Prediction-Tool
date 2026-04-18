const express = require('express');
const router = express.Router();
const backfillController = require('../controllers/backfillController');

// POST /api/backfill/start - Start historical data backfill
router.post('/start', backfillController.startBackfill);

// GET /api/backfill/status - Get backfill status
router.get('/status', backfillController.getBackfillStatus);

module.exports = router;
