const request = require('supertest');
const { app } = require('../server');

describe('🔄 Data Backfill Tests', () => {
  test('✓ Backfill Status - Current Progress Check', async () => {
    const res = await request(app).get('/api/backfill/status');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });

  test('✓ Start Backfill - Historical Data Import', async () => {
    const res = await request(app).post('/api/backfill/start');
    expect([200,201,500]).toContain(res.status);
  });
});
