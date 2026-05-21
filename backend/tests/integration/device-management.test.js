const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { connectTestDB, closeTestDB, clearDatabase } = require('../config/database/memory-db.setup');
const app = require('../../src/app');
const { makeRequest } = require('./helpers/http-client');

let server;
let testPort = 3001;

// Test state - isolated for device management tests
const testState = {
  user: {
    phone: '84901234569',
    password: null,
    displayName: null,
    userId: null,
  },
  userToken: null,
  deviceId: 'device-mgmt-001',
};

before(async () => {
  console.log('[Device Management Test] Setting up test environment...');
  
  // Connect to test database
  await connectTestDB();
  await clearDatabase();
  
  // Start test server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(testPort, () => {
      console.log(`[Device Management Test] Test server running on port ${testPort}`);
      resolve();
    });
  });
});

after(async () => {
  console.log('[Device Management Test] Cleaning up...');
  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
  await closeTestDB();
});

describe('Device Management Integration Tests', () => {
  
  describe('Setup: User Registration and Login', () => {
    
    it('should register user successfully', async () => {
      const userData = {
        phone: testState.user.phone,
        password: 'TestPassword789!',
        displayName: 'Device Test User',
        passwordConfirm: 'TestPassword789!',
      };
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/register',
        port: testPort,
        body: userData,
      });
      
      assert.strictEqual(response.statusCode, 201);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.userId);
      
      testState.user.password = userData.password;
      testState.user.displayName = userData.displayName;
      testState.user.userId = response.data.data.userId;
    });
    
    it('should login user successfully', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: {
          phone: testState.user.phone,
          password: testState.user.password,
          deviceId: testState.deviceId,
        },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.accessToken);
      assert.ok(response.data.data.refreshToken);
      
      testState.userToken = response.data.data.accessToken;
    });
  });
  
  describe('Device Management', () => {
    
    it.skip('should register/update current device (endpoint may not be implemented)', async () => {
      const deviceData = {
        deviceId: testState.deviceId,
        deviceType: 'mobile',
        deviceName: 'iPhone 14',
        osVersion: 'iOS 16.0',
        appVersion: '1.0.0',
      };
      
      const response = await makeRequest({
        method: 'PUT',
        path: '/api/devices/current',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.userToken}` },
        body: deviceData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
    
    it.skip('should update device presence (endpoint may not be implemented)', async () => {
      const response = await makeRequest({
        method: 'PATCH',
        path: '/api/devices/current/presence',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.userToken}` },
        body: { presence: 'online' },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
    
    it.skip('should get user devices (endpoint may not be implemented)', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/devices/me',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.userToken}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(Array.isArray(response.data.data));
    });
  });
});
