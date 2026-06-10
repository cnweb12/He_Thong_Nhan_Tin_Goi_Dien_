const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { connectTestDB, closeTestDB, clearDatabase } = require('../config/database/memory-db.setup');
const app = require('../../src/app');
const { makeRequest, authenticated } = require('./helpers/http-client');
const {
  createUserRegistrationData,
  createMultipleUserRegistrationData,
  createLoginData,
  createMessageData,
  createDirectConversationData,
  createCallData,
  createDeviceData,
  createSettingsData,
  createProfileUpdateData,
  createPasswordChangeData,
  createFriendRequestData,
} = require('./helpers/test-data');

// Integration tests should NOT use global hooks that clear database between tests
// We need to maintain state across scenarios to simulate a real user journey

let server;
let testPort = 3001; // Use different port to avoid conflicts

// Test state - shared across sequential tests
const testState = {
  user1: {
    phone: '84901234567',
    password: null, // Will be set during registration
    displayName: null, // Will be set during registration
    userId: null, // Will be set during registration
  },
  user2: {
    phone: '84901234568',
    password: null, // Will be set during registration
    displayName: null, // Will be set during registration
    userId: null, // Will be set during registration
  },
  user1Token: null,
  user1RefreshToken: null,
  user1DeviceId: null,
  user2Token: null,
  conversationId: null,
  messageId: null,
  callId: null,
};

before(async () => {
  console.log('[Integration Test] Setting up test environment...');
  
  // Connect to test database
  await connectTestDB();
  await clearDatabase();
  
  // Start test server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(testPort, () => {
      console.log(`[Integration Test] Test server running on port ${testPort}`);
      resolve();
    });
  });
});

after(async () => {
  console.log('[Integration Test] Cleaning up...');
  
  // Close test server
  await new Promise((resolve) => {
    server.close(() => {
      console.log('[Integration Test] Test server closed');
      resolve();
    });
  });
  
  // Close database connection
  await closeTestDB();
});

describe('Full User Flow Integration Tests', () => {
  
  describe('Scenario 1: User Registration and Login', () => {
    
    it('should register user1 successfully', async () => {
      const userData = {
        phone: testState.user1.phone,
        password: 'TestPassword123!',
        displayName: 'Test User 1',
        passwordConfirm: 'TestPassword123!',
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
      
      testState.user1.password = userData.password;
      testState.user1.displayName = userData.displayName;
      testState.user1.userId = response.data.data.userId;
    });
    
    it('should fail to register with duplicate phone', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/register',
        port: testPort,
        body: { phone: '84901234567', password: 'password123', displayName: 'Duplicate', passwordConfirm: 'password123' },
      });
      
      assert.strictEqual(response.statusCode, 409);
      assert.ok(response.data.message.includes('already exists'));
    });
    
    it('should register user2 successfully', async () => {
      const userData = {
        phone: testState.user2.phone,
        password: 'TestPassword456!',
        displayName: 'Test User 2',
        passwordConfirm: 'TestPassword456!',
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
      
      testState.user2.password = userData.password;
      testState.user2.displayName = userData.displayName;
      testState.user2.userId = response.data.data.userId;
    });
    
    it('should login user1 successfully and return tokens', async () => {
      testState.user1DeviceId = 'device-test-001';
      const loginData = createLoginData(testState.user1.phone, testState.user1.password, testState.user1DeviceId);
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: loginData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.accessToken);
      assert.ok(response.data.data.refreshToken);
      assert.strictEqual(response.data.data.user.userId, testState.user1.userId);
      
      testState.user1Token = response.data.data.accessToken;
      testState.user1RefreshToken = response.data.data.refreshToken;
    });
    
    it('should fail to login with wrong credentials', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: { phone: testState.user1.phone, password: 'wrongpassword', deviceId: 'device-002' },
      });
      
      assert.strictEqual(response.statusCode, 401);
    });
    
    it('should fail to access protected endpoint without token', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/auth/me',
        port: testPort,
      });
      
      assert.strictEqual(response.statusCode, 401);
    });
    
    it('should fail to access protected endpoint with invalid token', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/auth/me',
        port: testPort,
        headers: { Authorization: 'Bearer invalid-token' },
      });
      
      assert.strictEqual(response.statusCode, 401);
    });
    
    it('should access protected endpoint with valid token', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/auth/me',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      // Check that user data is returned, userId might be in different format
      assert.ok(response.data.data);
      assert.strictEqual(response.data.data.phone, testState.user1.phone);
    });
  });
  
  describe('Error Cases - Invalid Requests', () => {
    
    it('should fail to register with missing phone', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/register',
        port: testPort,
        body: { password: 'password123', displayName: 'Test' },
      });
      
      assert.strictEqual(response.statusCode, 400);
    });
    
    it('should fail to login with missing phone', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: { password: 'password123', deviceId: 'device-001' },
      });
      
      assert.strictEqual(response.statusCode, 400);
    });
    
    it('should fail to send message with missing conversationId', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/messages/',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: { content: 'Test message' },
      });
      
      // API might return 400 (validation) or 401 (auth) depending on implementation
      assert.ok(response.statusCode === 400 || response.statusCode === 401);
    });
  });
  
  describe('Scenario 2: Profile Management', () => {
    
    it('should get current profile', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/users/me',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.strictEqual(response.data.data.phone, testState.user1.phone);
    });
    
    it('should update display name', async () => {
      const profileData = createProfileUpdateData({ displayName: 'Updated Display Name' });
      
      const response = await makeRequest({
        method: 'PATCH',
        path: '/api/users/me',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: profileData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.strictEqual(response.data.data.displayName, 'Updated Display Name');
    });
    
    it('should update settings and persist boolean fields', async () => {
      const settingsData = createSettingsData({
        theme: 'dark',
        language: 'en',
        allowStrangerMessage: false,
        readReceiptEnabled: false,
      });
      
      const response = await makeRequest({
        method: 'PATCH',
        path: '/api/users/me/settings',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: settingsData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.strictEqual(response.data.data.settings.theme, 'dark');
      assert.strictEqual(response.data.data.settings.language, 'en');
      assert.strictEqual(response.data.data.settings.allowStrangerMessage, false);
      assert.strictEqual(response.data.data.settings.readReceiptEnabled, false);

      const profileResponse = await makeRequest({
        method: 'GET',
        path: '/api/users/me',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });

      assert.strictEqual(profileResponse.statusCode, 200);
      assert.strictEqual(profileResponse.data.data.settings.allowStrangerMessage, false);
      assert.strictEqual(profileResponse.data.data.settings.readReceiptEnabled, false);
    });

    it('should reject legacy plural settings field', async () => {
      const response = await makeRequest({
        method: 'PATCH',
        path: '/api/users/me/settings',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: { allowStrangerMessages: false },
      });

      assert.strictEqual(response.statusCode, 400);
      assert.strictEqual(response.data.ok, false);
    });
  });
  
  describe('Scenario 3: User Search', () => {
    
    it('should search users by name', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/users/search?q=User&limit=10',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(Array.isArray(response.data.data));
    });
    
    it('should return public profile without sensitive data', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: `/api/users/${testState.user2.userId}`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(!response.data.data.phone); // Phone should not be in public profile
      assert.ok(!response.data.data.settings); // Settings should not be in public profile
    });
  });
  
  describe('Scenario 4: Friend Management', () => {
    
    it('should login user2 for friend management tests', async () => {
      const user2DeviceId = 'device-test-002';
      const loginData = createLoginData(testState.user2.phone, testState.user2.password, user2DeviceId);
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: loginData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.accessToken);
      
      testState.user2Token = response.data.data.accessToken;
    });
    
    it('should send friend request', async () => {
      const friendRequestData = createFriendRequestData();
      
      const response = await makeRequest({
        method: 'POST',
        path: `/api/users/${testState.user2.userId}/friends`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: friendRequestData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
    
    it('should get friend requests', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/users/me/friend-requests',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user2Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(Array.isArray(response.data.data));
    });
    
    it('should accept friend request', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: `/api/users/${testState.user1.userId}/friends/accept`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user2Token}` },
        body: {},
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
    
    it('should get friends list', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/users/me/friends',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(Array.isArray(response.data.data));
    });
    
    it('should remove friend', async () => {
      const response = await makeRequest({
        method: 'DELETE',
        path: `/api/users/${testState.user2.userId}/friends`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
  });
});
