const mongoose = require('mongoose');

const apiEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['weather_api_call', 'report_download'] // Consistent naming
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  service: String, // e.g., 'openweathermap', 'weatherapi'
  endpoint: String, // e.g., '/current', '/forecast'
  city: String,
  success: Boolean
});

apiEventSchema.index({ type: 1, timestamp: -1 });

module.exports = mongoose.model('ApiEvent', apiEventSchema);