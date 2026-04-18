const mongoose = require('mongoose');

// Helper function to connect to MongoDB
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weather-alerts';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected for tests');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Helper function to disconnect from MongoDB
async function disconnectDB() {
  try {
    await mongoose.disconnect();
  } catch (err) {
    // Silently handle disconnect errors
  }
}

// Handle process termination quietly
process.on('SIGTERM', disconnectDB);
process.on('SIGINT', disconnectDB);

// Export setup function for Jest
module.exports = async () => {
  await connectDB();
};

// Export helper functions for test files
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;