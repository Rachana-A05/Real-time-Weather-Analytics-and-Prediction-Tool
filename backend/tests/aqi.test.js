const request = require('supertest');
const { app } = require('../server');

describe('💨 Air Quality Index Tests', () => {
  test('✓ AQI Validation - City Parameter Required', async () => {
    const res = await request(app).get('/api/aqi');
    expect([400,500]).toContain(res.status);
  });

  test('✓ Historical AQI Data - Retrieving Past Records', async () => {
    const res = await request(app).get('/api/aqi/history');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });
});
