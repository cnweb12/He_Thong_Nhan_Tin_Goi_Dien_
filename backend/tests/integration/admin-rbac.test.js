const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { connectTestDB, closeTestDB, clearDatabase } = require('../config/database/memory-db.setup');
const app = require('../../src/app');
const { makeRequest, createSuperAdminInDB, verifyRoleInToken } = require('./helpers/http-client');
const { createLoginData, createAdminRoleChangeData } = require('./helpers/test-data');
const config = require('../../src/config/env');

let server;
let testPort = 3001;

// Test state - shared across sequential tests
const testState = {
  superAdmin: {
    phone: '84999999999',
    password: 'SuperAdmin123!',
    displayName: 'Super Admin',
    userId: null,
  },
  admin: {
    phone: '84988888888',
    password: 'Admin123!',
    displayName: 'Admin User',
    userId: null,
  },
  regularUser: {
    phone: '84977777777',
    password: 'User123!',
    displayName: 'Regular User',
    userId: null,
  },
  superAdminToken: null,
  adminToken: null,
  userToken: null,
};

before(async () => {
  console.log('[Admin RBAC Test] Setting up test environment...');
  
  // Connect to test database
  await connectTestDB();
  await clearDatabase();
  
  // Start test server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(testPort, () => {
      console.log(`[Admin RBAC Test] Test server running on port ${testPort}`);
      resolve();
    });
  });
});

after(async () => {
  console.log('[Admin RBAC Test] Cleaning up...');
  
  // Close test server
  await new Promise((resolve) => {
    server.close(() => {
      console.log('[Admin RBAC Test] Test server closed');
      resolve();
    });
  });
  
  // Close database connection
  await closeTestDB();
});

describe('Admin RBAC Integration Tests', () => {
  
  describe('Setup: Super Admin Creation', () => {
    
    it('should create super admin directly in database', async () => {
      const superAdmin = await createSuperAdminInDB(
        testState.superAdmin.phone,
        testState.superAdmin.password,
        testState.superAdmin.displayName
      );
      
      assert.ok(superAdmin._id);
      assert.strictEqual(superAdmin.phone, testState.superAdmin.phone);
      assert.strictEqual(superAdmin.role, 'super_admin');
      
      testState.superAdmin.userId = superAdmin._id.toString();
    });
    
    it('should login super admin successfully', async () => {
      const loginData = createLoginData(
        testState.superAdmin.phone,
        testState.superAdmin.password,
        'device-super-001'
      );
      
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
      
      testState.superAdminToken = response.data.data.accessToken;
    });
    
    it('should verify role in JWT payload', async () => {
      const payload = verifyRoleInToken(testState.superAdminToken, config.jwtSecret);
      
      assert.ok(payload);
      assert.strictEqual(payload.role, 'super_admin');
      assert.strictEqual(payload.userId, testState.superAdmin.userId);
    });
  });
  
  describe('Scenario 1: Super Admin Role Management', () => {
    
    it('should register a regular user', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/register',
        port: testPort,
        body: {
          phone: testState.regularUser.phone,
          password: testState.regularUser.password,
          displayName: testState.regularUser.displayName,
          passwordConfirm: testState.regularUser.password,
        },
      });
      
      assert.strictEqual(response.statusCode, 201);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.userId);
      
      testState.regularUser.userId = response.data.data.userId;
    });
    
    it('should change user role to admin', async () => {
      const roleData = createAdminRoleChangeData('admin');
      
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/admin/users/${testState.regularUser.userId}/role`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
        body: roleData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
    
    it('should NOT change user role to super_admin (cannot create multiple super admins)', async () => {
      const roleData = createAdminRoleChangeData('super_admin');
      
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/admin/users/${testState.regularUser.userId}/role`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
        body: roleData,
      });
      
      assert.strictEqual(response.statusCode, 400);
      assert.ok(response.data.message.includes('Cannot create multiple super admins'));
    });
    
    it('should change user role back to user', async () => {
      const roleData = createAdminRoleChangeData('user');
      
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/admin/users/${testState.regularUser.userId}/role`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
        body: roleData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
    });
  });
  
  describe('Scenario 2: Admin Access Control', () => {
    
    it('should change user role to admin for testing', async () => {
      const roleData = createAdminRoleChangeData('admin');
      
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/admin/users/${testState.regularUser.userId}/role`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
        body: roleData,
      });
      
      assert.strictEqual(response.statusCode, 200);
    });
    
    it('should login as admin', async () => {
      const loginData = createLoginData(
        testState.regularUser.phone,
        testState.regularUser.password,
        'device-admin-001'
      );
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: loginData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.accessToken);
      
      testState.adminToken = response.data.data.accessToken;
    });
    
    it('should access admin endpoints as admin', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/admin/users?page=1&limit=20',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.adminToken}` },
      });
      
      assert.strictEqual(response.statusCode, 200);
    });
    
    it('should NOT be able to change user role as admin', async () => {
      const roleData = createAdminRoleChangeData('super_admin');
      
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/admin/users/${testState.superAdmin.userId}/role`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.adminToken}` },
        body: roleData,
      });
      
      assert.strictEqual(response.statusCode, 403);
    });
  });
  
  describe('Scenario 3: User Cannot Access Admin Endpoints', () => {
    
    it('should change user role back to user', async () => {
      const roleData = createAdminRoleChangeData('user');
      
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/admin/users/${testState.regularUser.userId}/role`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
        body: roleData,
      });
      
      assert.strictEqual(response.statusCode, 200);
    });
    
    it('should login as regular user', async () => {
      const loginData = createLoginData(
        testState.regularUser.phone,
        testState.regularUser.password,
        'device-user-001'
      );
      
      const response = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        port: testPort,
        body: loginData,
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.data.ok, true);
      assert.ok(response.data.data.accessToken);
      
      testState.userToken = response.data.data.accessToken;
    });
    
    it('should NOT access admin users endpoint as regular user', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/admin/users?page=1&limit=20',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.userToken}` },
      });
      
      assert.strictEqual(response.statusCode, 403);
    });
    
    it('should NOT access admin messages endpoint as regular user', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/admin/messages?page=1&limit=20',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.userToken}` },
      });
      
      assert.strictEqual(response.statusCode, 403);
    });
  });
  
  describe('Scenario 4: Admin Cannot Access User Endpoints', () => {
    
    it('should NOT access friends endpoint as admin', async () => {
      const response = await makeRequest({
        method: 'GET',
        path: '/api/users/me/friends',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.adminToken}` },
      });
      
      assert.strictEqual(response.statusCode, 403);
    });
    
    it.skip('should NOT send message as admin (requires MongoDB transactions)', async () => {
      const response = await makeRequest({
        method: 'POST',
        path: '/api/messages',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.adminToken}` },
        body: {
          conversationId: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId format
          type: 'text',
          text: 'Test message from admin',
        },
      });
      
      assert.strictEqual(response.statusCode, 403);
    });
  });
  
  describe('Scenario 5: Super Admin Full Access', () => {
    
    it('should access all admin endpoints as super admin', async () => {
      const usersResponse = await makeRequest({
        method: 'GET',
        path: '/api/admin/users?page=1&limit=20',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
      });
      
      assert.strictEqual(usersResponse.statusCode, 200);
      
      const messagesResponse = await makeRequest({
        method: 'GET',
        path: '/api/admin/messages?page=1&limit=20',
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
      });
      
      assert.strictEqual(messagesResponse.statusCode, 200);
    });
    
    it('should change user role as super admin', async () => {
      const roleData = createAdminRoleChangeData('admin');
      
      const response = await makeRequest({
        method: 'PATCH',
        path: `/api/admin/users/${testState.regularUser.userId}/role`,
        port: testPort,
        headers: { Authorization: `Bearer ${testState.superAdminToken}` },
        body: roleData,
      });
      
      assert.strictEqual(response.statusCode, 200);
    });
  });
});
