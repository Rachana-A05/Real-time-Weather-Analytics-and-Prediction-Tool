const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Temperature', 'Wind', 'Humidity', 'Pressure', 'AQI', 'Weather'], // Added Wind, Humidity, Pressure
    index: true
  },
  city: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'High', 'Critical'],
    default: 'High'
  },
  value: {
    type: Number,
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
alertSchema.index({ timestamp: -1 });
alertSchema.index({ city: 1, type: 1 });
alertSchema.index({ severity: 1 });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
