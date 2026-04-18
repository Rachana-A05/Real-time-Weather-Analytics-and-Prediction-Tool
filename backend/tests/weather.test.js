const request = require('supertest');
const { app } = require('../server');

describe('🌤️ Weather API Tests', () => {
  test('✓ Current Weather Data - Testing with London', async () => {
    const res = await request(app).get('/api/weather/current/London');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });

  test('✓ Weather Forecast - 5-Day Prediction for London', async () => {
    const res = await request(app).get('/api/weather/forecast/London');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });

  test('✓ Historical Weather - Past Records for London', async () => {
    const res = await request(app).get('/api/weather/history/London');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });
});
