const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { io } = require('socket.io-client');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { registerModels } = require('../../database/mongo');
const app = require('../../src/app');
const { initializeSocket, resetAllDevicesToOffline, getIO } = require('../../src/socket/socket');
const { makeRequest, makeAuthenticatedRequest } = require('./helpers/http-client');
const { generatePhone, generatePassword, generateDisplayName, generateDeviceId, createMessageData } = require('./helpers/test-data');
const { UserModel } = require('../../src/modules/users/models/user.model');
const { ConversationModel } = require('../../src/modules/conversations/models/conversation.model');
const { ConversationMemberModel } = require('../../src/modules/conversations/models/conversation-member.model');
const { UserDeviceModel } = require('../../src/modules/devices/models/user-device.model');
const authMiddleware = require('../../src/modules/auth/middleware/auth.middleware');
const config = require('../../src/config/env');

let server;
let testPort;
let mongoServer;
const JWT_SECRET = config.jwtSecret;

// Test state
const testState = {
  user1: {
    phone: null,
    password: null,
    displayName: null,
    userId: null,
  },
  user2: {
    phone: null,
    password: null,
    displayName: null,
    userId: null,
  },
  user1Token: null,
  user2Token: null,
  conversationId: null,
  deviceId1: null,
  deviceId2: null,
};

before(async () => {
  console.log('[WebSocket Test] Setting up test environment...');
  
  // Start MongoDB memory server as a Replica Set to support transactions
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  
  // Connect to test database
  await mongoose.connect(mongoUri);
  registerModels();
  
  // Clear database
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  
  // Start test server on port 0 (random available port)
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      testPort = server.address().port;
      console.log(`[WebSocket Test] Test server running on port ${testPort}`);
      resolve();
    });
  });
  
  // Initialize Socket.IO with actual implementation
  initializeSocket(server);
  
  // Reset devices to offline
  await resetAllDevicesToOffline();
  
  // Setup test users
  testState.user1.phone = generatePhone();
  testState.user1.password = generatePassword();
  testState.user1.displayName = generateDisplayName();
  testState.deviceId1 = generateDeviceId();
  
  testState.user2.phone = generatePhone();
  testState.user2.password = generatePassword();
  testState.user2.displayName = generateDisplayName();
  testState.deviceId2 = generateDeviceId();
  
  // Create users in database
  const passwordHash1 = authMiddleware.hashToken(testState.user1.password);
  const user1 = await UserModel.create({
    phone: testState.user1.phone,
    username: testState.user1.phone,
    displayName: testState.user1.displayName,
    passwordHash: passwordHash1,
    role: 'user',
  });
  testState.user1.userId = user1._id.toString();
  
  const passwordHash2 = authMiddleware.hashToken(testState.user2.password);
  const user2 = await UserModel.create({
    phone: testState.user2.phone,
    username: testState.user2.phone,
    displayName: testState.user2.displayName,
    passwordHash: passwordHash2,
    role: 'user',
  });
  testState.user2.userId = user2._id.toString();
  
  // Generate JWT tokens
  testState.user1Token = authMiddleware.generateJWTToken(
    { userId: testState.user1.userId, phone: testState.user1.phone, role: 'user' },
    JWT_SECRET
  );
  testState.user2Token = authMiddleware.generateJWTToken(
    { userId: testState.user2.userId, phone: testState.user2.phone, role: 'user' },
    JWT_SECRET
  );
  
  // Create a conversation between users
  const conversation = await ConversationModel.create({
    type: 'direct',
    directKey: `${testState.user1.userId}:${testState.user2.userId}`,
    createdBy: testState.user1.userId,
    memberCount: 2,
  });
  testState.conversationId = conversation._id.toString();
  
  // Add both users as members
  await ConversationMemberModel.create({
    conversationId: testState.conversationId,
    userId: testState.user1.userId,
    role: 'owner',
    isActive: true,
  });
  await ConversationMemberModel.create({
    conversationId: testState.conversationId,
    userId: testState.user2.userId,
    role: 'member',
    isActive: true,
  });
});

after(async () => {
  console.log('[WebSocket Test] Cleaning up...');
  
  // Close Socket.IO server to clear ping/pong timers
  try {
    const ioServer = getIO();
    if (ioServer) {
      ioServer.close();
    }
  } catch (error) {
    // Ignore if IO is not initialized
  }

  // Close HTTP server
  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
  
  // Wait a moment for any pending socket "disconnect" events to finish updating DB
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Close MongoDB connection
  await mongoose.disconnect();
  
  // Stop MongoMemoryServer
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Helper function to create socket client
function createSocketClient(token, deviceId) {
  return io(`http://localhost:${testPort}`, {
    auth: {
      token: `Bearer ${token}`,
      deviceId,
    },
    transports: ['websocket'],
    forceNew: true, // ensure independent socket connection
    reconnection: false, // prevent auto-reconnection during tests
    timeout: 5000, // connection timeout
  });
}

// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

describe('WebSocket Integration Tests', () => {
  
  // Clean up before each test to prevent state leakage
  beforeEach(async () => {
    // Clear devices to ensure clean state
    await UserDeviceModel.deleteMany({});
  });
  
  describe('Phase 1: Authentication & Connection', () => {
    
    it('TC1.1: Should reject connection if client does not provide token', async () => {
      const client = io(`http://localhost:${testPort}`, {
        auth: {},
        transports: ['websocket'],
        forceNew: true,
      });
      
      await new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          reject(new Error('Connection should have been rejected'));
        }, 2000);
        
        client.on('connect_error', (error) => {
          clearTimeout(timeout);
          try {
            assert.ok(error.message.includes('Authentication error'));
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      }).finally(() => {
        client.disconnect();
      });
    });
    
    it('TC1.2: Should accept connection with valid token and set device online', async () => {
      const client = createSocketClient(testState.user1Token, testState.deviceId1);
      
      await new Promise((resolve, reject) => {
        client.on('connect', async () => {
          try {
            // Wait for connection handler to update DB (since it's async now)
            let device;
            for(let i=0; i<10; i++) {
              device = await UserDeviceModel.findOne({ userId: testState.user1.userId, deviceId: testState.deviceId1 });
              if (device && device.isOnline) break;
              await new Promise(r => setTimeout(r, 50));
            }
            
            assert.ok(device);
            assert.strictEqual(device.isOnline, true);
            assert.ok(device, "Device should be found");
            assert.strictEqual(device.isOnline, true, "Device should be online");
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        client.on('connect_error', reject);
      }).finally(() => {
        client.disconnect();
      });
    });
    
    it('TC1.3: Should set device offline when client disconnects', async () => {
      const client = createSocketClient(testState.user1Token, testState.deviceId1);
      
      await new Promise((resolve, reject) => {
        client.on('connect', async () => {
          // Wait for connection handler to update DB
          let device;
          for(let i=0; i<10; i++) {
            device = await UserDeviceModel.findOne({ userId: testState.user1.userId, deviceId: testState.deviceId1 });
            if (device && device.isOnline) break;
            await new Promise(r => setTimeout(r, 50));
          }
          
          client.disconnect();
          resolve();
        });
        client.on('connect_error', reject);
      });
      
      // Wait a bit for disconnect to be processed
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Check database for device offline status
      const device = await UserDeviceModel.findOne({
        userId: testState.user1.userId,
        deviceId: testState.deviceId1,
      });
      
      assert.ok(device);
      assert.strictEqual(device.isOnline, false);
    });
    
    it('TC1.4: Multi-device - Device 1 offline should not affect Device 2', async () => {
      const deviceId1 = generateDeviceId();
      const deviceId2 = generateDeviceId();
      
      const client1 = createSocketClient(testState.user1Token, deviceId1);
      const client2 = createSocketClient(testState.user1Token, deviceId2);
      
      await new Promise((resolve, reject) => {
        let connectedCount = 0;
        const checkConnected = () => {
          connectedCount++;
          if (connectedCount === 2) resolve();
        };
        
        client1.on('connect', checkConnected);
        client2.on('connect', checkConnected);
        client1.on('connect_error', reject);
        client2.on('connect_error', reject);
      });
      
      // Disconnect device 1
      client1.disconnect();
      
      // Wait for disconnect to be processed
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      try {
        // Check device statuses
        const device1 = await UserDeviceModel.findOne({
          userId: testState.user1.userId,
          deviceId: deviceId1,
        });
        const device2 = await UserDeviceModel.findOne({
          userId: testState.user1.userId,
          deviceId: deviceId2,
        });
        
        assert.strictEqual(device1.isOnline, false);
        assert.strictEqual(device2.isOnline, true);
      } finally {
        client2.disconnect();
      }
    });
  });
  
  describe('Phase 2: Room Management', () => {
    
    it('TC2.1: Should allow client to join room they are a member of', async () => {
      const client = createSocketClient(testState.user1Token, testState.deviceId1);
      
      await withTimeout(
        new Promise((resolve, reject) => {
          client.on('connect', () => {
            client.emit('join_room', { conversationId: testState.conversationId }, (response) => {
              try {
                assert.strictEqual(response.ok, true);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
          });
          client.on('connect_error', reject);
        }).finally(() => {
          client.disconnect();
        }),
        5000,
        'TC2.1: Timeout waiting to join room'
      );
    });
    
    it('TC2.2: Should reject join room for non-participant user', async () => {
      // Create a new user who is not a participant
      const phone = generatePhone();
      const password = generatePassword();
      const passwordHash = authMiddleware.hashToken(password);
      const newUser = await UserModel.create({
        phone,
        username: phone,
        displayName: 'Non Participant',
        passwordHash,
        role: 'user',
      });
      const newToken = authMiddleware.generateJWTToken(
        { userId: newUser._id.toString(), phone, role: 'user' },
        JWT_SECRET
      );
      
      const client = createSocketClient(newToken, generateDeviceId());
      
      await withTimeout(
        new Promise((resolve, reject) => {
          client.on('connect', async () => {
            // Small delay to ensure socket is fully ready
            await new Promise(r => setTimeout(r, 50));
            
            let callbackTimeout = setTimeout(() => {
              reject(new Error('TC2.2: join_room callback timeout - server did not respond'));
            }, 5000);
            
            client.emit('join_room', { conversationId: testState.conversationId }, (response) => {
              clearTimeout(callbackTimeout);
              try {
                assert.strictEqual(response.ok, false);
                assert.ok(response.error.includes('Not a participant'));
                resolve();
              } catch (e) {
                reject(e);
              }
            });
          });
          client.on('connect_error', reject);
        }).finally(() => {
          client.disconnect();
        }),
        10000,
        'TC2.2: Timeout waiting for join room rejection'
      );
    });
    
    it('TC2.3: Should allow client to leave room successfully', async () => {
      const client = createSocketClient(testState.user1Token, testState.deviceId1);
      
      await withTimeout(
        new Promise((resolve, reject) => {
          client.on('connect', async () => {
            // Small delay to ensure socket is fully ready
            await new Promise(r => setTimeout(r, 50));
            
            let joinTimeout = setTimeout(() => {
              reject(new Error('TC2.3: join_room callback timeout - server did not respond'));
            }, 5000);
            
            client.emit('join_room', { conversationId: testState.conversationId }, (response) => {
              clearTimeout(joinTimeout);
              try {
                assert.strictEqual(response.ok, true);
                
                let leaveTimeout = setTimeout(() => {
                  reject(new Error('TC2.3: leave_room callback timeout - server did not respond'));
                }, 5000);
                
                client.emit('leave_room', { conversationId: testState.conversationId }, (leaveResponse) => {
                  clearTimeout(leaveTimeout);
                  try {
                    assert.strictEqual(leaveResponse.ok, true);
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                });
              } catch (e) {
                reject(e);
              }
            });
          });
          client.on('connect_error', reject);
        }).finally(() => {
          client.disconnect();
        }),
        15000,
        'TC2.3: Timeout waiting to leave room'
      );
    });
  });
  
  describe('Phase 3: Typing Indicators', () => {
    
    it('TC3.1: User A typing_start should be received by User B but not User A', async () => {
      const clientA = createSocketClient(testState.user1Token, testState.deviceId1);
      const clientB = createSocketClient(testState.user2Token, testState.deviceId2);
      
      try {
        // Both join the room
        await withTimeout(
          new Promise((resolve, reject) => {
            let joinedCount = 0;
            const checkJoined = () => {
              joinedCount++;
              if (joinedCount === 2) resolve();
            };
            
            clientA.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientA.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });
            
            clientB.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientB.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });

            clientA.on('connect_error', reject);
            clientB.on('connect_error', reject);
          }),
          5000,
          'TC3.1: Timeout waiting for both clients to join room'
        );
        
        // User A starts typing
        const typingStartPromise = withTimeout(
          new Promise((resolve, reject) => {
            clientB.on('typing_start', (data) => {
              try {
                assert.strictEqual(data.conversationId, testState.conversationId);
                assert.strictEqual(data.userId, testState.user1.userId);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
          }),
          5000,
          'TC3.1: Timeout waiting for typing_start event'
        );
        
        clientA.emit('typing_start', { conversationId: testState.conversationId });
        
        await typingStartPromise;
        
        // Verify User A does not receive the event (echo prevention)
        let userAReceived = false;
        clientA.on('typing_start', () => {
          userAReceived = true;
        });
        
        await new Promise((resolve) => setTimeout(resolve, 200));
        assert.strictEqual(userAReceived, false);
      } finally {
        clientA.disconnect();
        clientB.disconnect();
      }
    });
    
    it('TC3.2: User A typing_stop should be received by User B', async () => {
      const clientA = createSocketClient(testState.user1Token, testState.deviceId1);
      const clientB = createSocketClient(testState.user2Token, testState.deviceId2);
      
      try {
        // Both join the room
        await withTimeout(
          new Promise((resolve, reject) => {
            let joinedCount = 0;
            const checkJoined = () => {
              joinedCount++;
              if (joinedCount === 2) resolve();
            };
            
            clientA.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientA.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });
            
            clientB.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientB.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });
            clientA.on('connect_error', reject);
            clientB.on('connect_error', reject);
          }),
          5000,
          'TC3.2: Timeout waiting for both clients to join room'
        );
        
        // User A stops typing
        const typingStopPromise = withTimeout(
          new Promise((resolve, reject) => {
            clientB.on('typing_stop', (data) => {
              try {
                assert.strictEqual(data.conversationId, testState.conversationId);
                assert.strictEqual(data.userId, testState.user1.userId);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
          }),
          5000,
          'TC3.2: Timeout waiting for typing_stop event'
        );
        
        clientA.emit('typing_stop', { conversationId: testState.conversationId });
        
        await typingStopPromise;
      } finally {
        clientA.disconnect();
        clientB.disconnect();
      }
    });
  });
  
  describe('Phase 4: Integration - HTTP and Socket', () => {
    
    it('TC4.1: POST /api/messages should emit new_message to room (anti-echo)', async () => {
      const clientA = createSocketClient(testState.user1Token, testState.deviceId1);
      const clientB = createSocketClient(testState.user2Token, testState.deviceId2);
      
      try {
        // Both join the room
        await withTimeout(
          new Promise((resolve, reject) => {
            let joinedCount = 0;
            const checkJoined = () => {
              joinedCount++;
              if (joinedCount === 2) resolve();
            };
            
            clientA.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientA.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });
            
            clientB.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientB.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });
            clientA.on('connect_error', reject);
            clientB.on('connect_error', reject);
          }),
          5000,
          'TC4.1: Timeout waiting for both clients to join room'
        );
        
        // Setup listener for User B
        const messagePromise = new Promise((resolve, reject) => {
          let timeout = setTimeout(() => reject(new Error('Timeout waiting for new_message')), 5000);
          clientB.on('new_message', (message) => {
            clearTimeout(timeout);
            try {
              assert.ok(message);
              assert.strictEqual(message.conversationId, testState.conversationId);
              assert.strictEqual(message.senderId, testState.user1.userId);
              resolve(message);
            } catch (e) {
              reject(e);
            }
          });
        });
        
        // User A sends message via HTTP API
        const messageData = createMessageData(testState.conversationId, 'Hello from User A!');
        const response = await makeAuthenticatedRequest({
          method: 'POST',
          path: '/api/messages',
          port: testPort,
          body: messageData,
          token: testState.user1Token,
        });
        
        assert.strictEqual(response.statusCode, 201, `Failed to send message: ${JSON.stringify(response.data)}`);
        assert.strictEqual(response.data.ok, true);
        
        // Wait for socket event
        const socketMessage = await messagePromise;
        assert.strictEqual(socketMessage.text, messageData.text);
        
        // Verify User A does not receive the event (anti-echo)
        let userAReceived = false;
        clientA.on('new_message', () => {
          userAReceived = true;
        });
        
        await new Promise((resolve) => setTimeout(resolve, 200));
        assert.strictEqual(userAReceived, false);
      } finally {
        clientA.disconnect();
        clientB.disconnect();
      }
    });
    
    it('TC4.2: PATCH /api/conversations/:conversationId/read should emit message_read', async () => {
      const clientA = createSocketClient(testState.user1Token, testState.deviceId1);
      const clientB = createSocketClient(testState.user2Token, testState.deviceId2);
      
      try {
        // Both join the room
        await withTimeout(
          new Promise((resolve, reject) => {
            let joinedCount = 0;
            const checkJoined = () => {
              joinedCount++;
              if (joinedCount === 2) resolve();
            };
            
            clientA.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientA.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });
            
            clientB.on('connect', async () => {
              await new Promise(r => setTimeout(r, 50));
              clientB.emit('join_room', { conversationId: testState.conversationId }, checkJoined);
            });
            clientA.on('connect_error', reject);
            clientB.on('connect_error', reject);
          }),
          5000,
          'TC4.2: Timeout waiting for both clients to join room'
        );
        
        // Setup listener for User A
        const readPromise = new Promise((resolve, reject) => {
          let timeout = setTimeout(() => reject(new Error('Timeout waiting for message_read')), 5000);
          clientA.on('message_read', (data) => {
            clearTimeout(timeout);
            try {
              assert.ok(data);
              assert.strictEqual(data.conversationId, testState.conversationId);
              assert.strictEqual(data.userId, testState.user2.userId);
              assert.strictEqual(data.lastSeenSeq, 1);
              resolve(data);
            } catch (e) {
              reject(e);
            }
          });
        });
        
        // User B marks as read via HTTP API
        const response = await makeAuthenticatedRequest({
          method: 'PATCH',
          path: `/api/conversations/${testState.conversationId}/read`,
          port: testPort,
          body: { lastSeenSeq: 1 },
          token: testState.user2Token,
        });
        
        assert.strictEqual(response.statusCode, 200, `Failed to mark read: ${JSON.stringify(response.data)}`);
        assert.strictEqual(response.data.ok, true);
        
        // Wait for socket event
        await readPromise;
      } finally {
        clientA.disconnect();
        clientB.disconnect();
      }
    });
  });
});
