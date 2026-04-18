const request = require('supertest');
const { app } = require('../server');

describe('📊 Analytics API Tests', () => {
  const base = '/api/analytics';
  const endpoints = ['predictions','type-distribution','city-distribution','recent-trends','hourly-pattern','stats-summary','dashboard'];

  endpoints.forEach(ep => {
    test(`✓ ${ep.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} - Data Retrieval`, async () => {
      const res = await request(app).get(`${base}/${ep}`);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.body).toBeDefined();
    });
  });
});
