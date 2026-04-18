const { app } = require('../server');
const request = require('supertest')(app);
const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const { connectDB, disconnectDB } = require('./setup');

describe('🌪️ Extreme Weather Alerts Tests', () => {
  let alerts;
  
  beforeAll(async () => {
    await connectDB();
    alerts = await Alert.find({}).sort('-createdAt').limit(10);
  });

  test('✓ Validate Extreme Weather Alert Structure and Properties', async () => {
    // Validation checks matching screenshot
    expect(Array.isArray(alerts)).toBe(true);
    
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        expect(alert).toBeInstanceOf(Object);
        expect(alert).toHaveProperty('city');
        expect(alert).toHaveProperty('severity');
        expect(alert.type).toEqual(expect.any(String));
        expect(alert.severity).toEqual(expect.any(String));
        expect(alert).toHaveProperty('timestamp');
        expect(alert.duplicate).toBeFalsy();
        expect(alert).toHaveProperty('value');
        expect(alert.message).toEqual(expect.any(String));
      });
    }
  });

  afterAll(async () => {
    try {
      await disconnectDB();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  });
});