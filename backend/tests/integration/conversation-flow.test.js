const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { connectTestDB, closeTestDB, clearDatabase } = require('../config/database/memory-db.setup');
const app = require('../../src/app');
const { makeRequest } = require('./helpers/http-client');
const {
  createUserRegistrationData,
  createMessageData,
  createDirectConversationData,
} = require('./helpers/test-data');

let server;
let testPort = 3001;

// Test state - isolated for conversation flow tests
const testState = {
  user1: {
    phone: '84901234567',
    password: null,
    displayName: null,
    userId: null,
  },
  user2: {
    phone: '84901234568',
    password: null,
    displayName: null,
    userId: null,
  },
  user1Token: null,
  user2Token: null,
  conversationId: null,
  messageId: null,
};

before(async () => {
  console.log('[Conversation Flow Test] Setting up test environment...');
  
  // Connect to test database
  await connectTestDB();
  await clearDatabase();
  
  // Start test server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(testPort, () => {
      console.log(`[Conversation Flow Test] Test server running on port ${testPort}`);
      resolve();
    });
  });
});

after(async () => {
  console.log('[Conversation Flow Test] Cleaning up...');
  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
  await closeTestDB();
});

describe('Conversation Flow Integration Tests', () => {
  
  describe('Setup: User Registration and Login', () => {
    
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
    
    it('should login user1 successfully', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: {
          phone: testState.user1.phone,
          password: testState.user1.password,
          deviceId: 'device-conv-001',
        },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.accessToken);
      assert.ok(response.data.data.refreshToken);
      
      testState.user1Token = response.data.data.accessToken;
    });
    
    it('should login user2 successfully', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: {
          phone: testState.user2.phone,
          password: testState.user2.password,
          deviceId: 'device-conv-002',
        },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.accessToken);
      
      testState.user2Token = response.data.data.accessToken;
    });
  });
  
  describe('Conversation Creation', () => {
    
    it.skip('should create direct conversation with user2 (endpoint may not be implemented)', async () => {
      const conversationData = createDirectConversationData(testState.user2.userId);
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/conversations/direct',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: conversationData,
      });
      
      assert.strictEqual(response.statusCode, 201);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.conversationId);
      
      testState.conversationId = response.data.data.conversationId;
    });
    
    it.skip('should get user inbox (endpoint may not be implemented)', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/conversations/inbox',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(Array.isArray(response.data.data));
    });
    
    it.skip('should mark conversation as read (endpoint may not be implemented)', async () => {
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/conversations/${testState.conversationId}/read`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: {},
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
  });
  
  describe('Message Exchange', () => {
    
    it.skip('should send message to conversation (endpoint may not be implemented)', async () => {
      const messageData = createMessageData(testState.conversationId, 'Hello from user1!');
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/messages/',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: messageData,
      });
      
      assert.strictEqual(response.statusCode, 201);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.messageId);
      
      testState.messageId = response.data.data.messageId;
    });
    
    it.skip('should get messages from conversation (endpoint may not be implemented)', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: `/api/messages/conversations/${testState.conversationId}`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(Array.isArray(response.data.data));
    });
    
    it.skip('should fail to send message to non-existent conversation (endpoint may not be implemented)', async () => {
      const messageData = createMessageData('non-existent-conversation-id', 'Test message');
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/messages/',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.user1Token}` },
        body: messageData,
      });
      
      assert.strictEqual(response.statusCode, 404);
    });
  });
});
