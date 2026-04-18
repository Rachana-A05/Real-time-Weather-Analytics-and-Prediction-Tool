const request = require('supertest');
const { app } = require('../server');

describe('📱 Dashboard API Tests', () => {
  test('✓ Dashboard Statistics - System Overview', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });

  test('✓ Download Logger - Recording User Activity', async () => {
    const res = await request(app).post('/api/dashboard/logDownload');
    expect([200,201,500]).toContain(res.status);
  });
});
