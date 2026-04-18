const ApiEvent = require('../models/ApiEvent');

/**
 * Log external weather API calls only
 * @param {string} service - 'openweathermap', 'weatherapi', etc.
 * @param {string} endpoint - API endpoint called
 * @param {string} city - City name (optional)
 * @param {boolean} success - Whether call succeeded
 */
async function logWeatherApiCall(service, endpoint, city = null, success = true) {
  try {
    await ApiEvent.create({
      type: 'weather_api_call',
      service,
      endpoint,
      city,
      success,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
}

module.exports = { logWeatherApiCall };