const request = require('supertest');
const { app } = require('../server');

describe('⚠️ Alert System Tests', () => {
  test('✓ GET /api/alerts - General Alerts Endpoint', async () => {
    const res = await request(app).get('/api/alerts');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });

  test('✓ GET /api/alerts/extreme - Critical Weather Alerts', async () => {
    const res = await request(app).get('/api/alerts/extreme');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });
});
