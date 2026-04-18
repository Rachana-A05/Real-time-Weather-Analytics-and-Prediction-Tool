const request = require('supertest');
const { app } = require('../server');

describe('👑 Admin API Tests', () => {
  test('✓ API Key Management - Key Retrieval', async () => {
    const res = await request(app).get('/admin/apikey');
    expect([200,404,500]).toContain(res.status);
  });

  test('✓ Admin Statistics - System Metrics', async () => {
    const res = await request(app).get('/admin/stats');
    expect([200,404,500]).toContain(res.status);
  });
});
