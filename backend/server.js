const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const alertsRouter = require('./routes/alerts');
const weatherRoutes = require('./routes/weather');
const analyticsRoutes = require('./routes/analytics');
const predictRoutes = require('./routes/predict');
const adminRoutes = require('./routes/admin');
const aqiRouter = require('./routes/aqi');
const backfillRoutes = require('./routes/backfill');
const dashboardRoutes = require('./routes/dashboard');

const uptimeMonitor = require('./services/uptimeMonitor');

const app = express();
const PORT = process.env.PORT || 5000;

// ------------- CORS BEFORE EVERYTHING! ------------------
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// ------------- REMOVED BAD API EVENT LOGGING MIDDLEWARE -------------
// The old middleware was logging EVERY request including dashboard stats
// This caused false API call counts (358 calls when you made none!)
// API calls are now logged only when ACTUAL external weather APIs are called
// See: routes/dashboard.js and utils/logApiCall.js for proper tracking

// ------------- ERROR TRACKING MIDDLEWARE ------------------
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      uptimeMonitor.logError(
        new Error(`${req.method} ${req.path} returned ${res.statusCode}`),
        'error'
      );
    }
  });
  next();
});

// ------------- MONGODB CONNECTION ------------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weather-alerts';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', MONGODB_URI);
  
  // Start weather monitoring after DB connection
  try {
    const { startMonitoring } = require('./services/weatherMonitor');
    startMonitoring();
    console.log('🌤️  Weather monitoring started');
  } catch (error) {
    console.error('⚠️  Weather monitoring failed to start:', error.message);
    uptimeMonitor.logError(error, 'warning');
  }
  uptimeMonitor.startMonitoring();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  uptimeMonitor.logError(err, 'critical');
  console.log('⚠️  Server will run without real-time monitoring');
});

// Monitor MongoDB connection issues
mongoose.connection.on('error', (err) => {
  uptimeMonitor.logError(new Error(`MongoDB connection error: ${err.message}`), 'critical');
});
mongoose.connection.on('disconnected', () => {
  uptimeMonitor.logError(new Error('MongoDB disconnected'), 'critical');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// ------------- MOUNT ROUTES ------------------
app.use('/api/alerts', alertsRouter);
app.use('/api/weather', weatherRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/aqi', aqiRouter);
app.use('/admin', adminRoutes);
app.use('/api/backfill', backfillRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ------------- SUBSCRIBE ENDPOINT ------------------
const CSVPATH = path.join(__dirname, 'subscribers.csv');
app.post('/api/subscribe', (req, res) => {
  try {
    const { contact, type } = req.body;
    if (!contact) return res.status(400).json({ error: 'Contact required' });
    const row = `${contact.replace(/,/g, '')},${type}\n`;
    if (!fs.existsSync(CSVPATH)) fs.writeFileSync(CSVPATH, 'contact,type\n');
    fs.appendFileSync(CSVPATH, row);
    res.json({ message: `Subscribed! You'll now receive alerts via ${type}.` });
  } catch (error) {
    uptimeMonitor.logError(error, 'error');
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// ------------- UPTIME ENDPOINT ------------------
app.get('/api/uptime', (req, res) => {
  try {
    const stats = uptimeMonitor.getStats();
    res.json(stats);
  } catch (error) {
    uptimeMonitor.logError(error, 'error');
    res.status(500).json({ error: 'Failed to get uptime stats' });
  }
});

// ------------- HEALTH CHECK ------------------
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Weather Alerts API is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ------------- GLOBAL ERROR HANDLER ------------------
app.use((err, req, res, next) => {
  console.error('Error:', err);
  uptimeMonitor.logError(err, 'error');
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

// ------------- UNHANDLED ERRORS ------------------
process.on('unhandledRejection', (reason, promise) => {
  uptimeMonitor.logError(
    new Error(`Unhandled Rejection: ${reason}`),
    'critical'
  );
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  uptimeMonitor.logError(error, 'critical');
  console.error('Uncaught Exception:', error);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// ------------- GRACEFUL SHUTDOWN ------------------
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  uptimeMonitor.stopMonitoring();
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  uptimeMonitor.stopMonitoring();
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

// ------------- START SERVER ------------------
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('🚀 Weather Alerts Backend Server Started');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`📡 API Server: http://localhost:${PORT}`);
  console.log(`🏥 Uptime Monitor: http://localhost:${PORT}/api/uptime`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
//  console.log(`👥 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log('📝 NOTE: API call tracking now only counts external weather API calls');
  console.log('   Internal requests (dashboard stats, health checks) are NOT counted');
  console.log('');
});

server.on('error', (error) => {
  uptimeMonitor.logError(error, 'critical');
  console.error('Server error:', error);
});

module.exports = { app, uptimeMonitor };