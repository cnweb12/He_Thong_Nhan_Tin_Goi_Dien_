const http = require('http');
const { connectTestDB, closeTestDB } = require('../../config/database/memory-db.setup');
const { registerModels } = require('../../../database/mongo');
const { UserModel } = require('../../../src/modules/users/models/user.model');
const authMiddleware = require('../../../src/modules/auth/middleware/auth.middleware');

/**
 * Make HTTP request to the test server
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method
 * @param {string} options.path - Request path
 * @param {Object} options.headers - Request headers
 * @param {Object} options.body - Request body (will be JSON stringified)
 * @param {number} options.port - Server port (default: 3000)
 * @param {string} options.hostname - Server hostname (default: localhost)
 * @returns {Promise<Object>} Response with status, headers, and data
 */
function makeRequest({ method, path, headers = {}, body, port = 3000, hostname = 'localhost' }) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      hostname,
      port,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      const bodyString = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Make authenticated request with JWT token
 * @param {Object} options - Request options
 * @param {string} options.token - JWT access token
 * @returns {Promise<Object>} Response
 */
function makeAuthenticatedRequest({ token, ...options }) {
  return makeRequest({
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * HTTP methods shortcuts
 */
const httpMethods = {
  get: (path, options = {}) => makeRequest({ method: 'GET', path, ...options }),
  post: (path, body, options = {}) => makeRequest({ method: 'POST', path, body, ...options }),
  put: (path, body, options = {}) => makeRequest({ method: 'PUT', path, body, ...options }),
  patch: (path, body, options = {}) => makeRequest({ method: 'PATCH', path, body, ...options }),
  delete: (path, options = {}) => makeRequest({ method: 'DELETE', path, ...options }),
};

/**
 * Authenticated HTTP methods shortcuts
 */
const authenticatedHttpMethods = {
  get: (path, token, options = {}) => makeAuthenticatedRequest({ method: 'GET', path, token, ...options }),
  post: (path, body, token, options = {}) => makeAuthenticatedRequest({ method: 'POST', path, body, token, ...options }),
  put: (path, body, token, options = {}) => makeAuthenticatedRequest({ method: 'PUT', path, body, token, ...options }),
  patch: (path, body, token, options = {}) => makeAuthenticatedRequest({ method: 'PATCH', path, body, token, ...options }),
  delete: (path, token, options = {}) => makeAuthenticatedRequest({ method: 'DELETE', path, token, ...options }),
};

/**
 * Create a super admin user directly in database
 * @param {string} phone - Phone number
 * @param {string} password - Password
 * @param {string} displayName - Display name
 * @returns {Promise<Object>} Created user object
 */
async function createSuperAdminInDB(phone, password, displayName = 'Super Admin') {
  registerModels();
  const passwordHash = authMiddleware.hashToken(password);
  const now = new Date();
  
  const superAdmin = await UserModel.create({
    phone,
    username: phone,
    displayName,
    passwordHash,
    role: 'super_admin',
    createdAt: now,
    updatedAt: now,
  });
  
  return superAdmin;
}

/**
 * Verify role in JWT token payload
 * @param {string} token - JWT access token
 * @param {string} secret - JWT secret
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyRoleInToken(token, secret) {
  try {
    const payload = authMiddleware.verifyJWTToken(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

module.exports = {
  makeRequest,
  makeAuthenticatedRequest,
  ...httpMethods,
  authenticated: authenticatedHttpMethods,
  createSuperAdminInDB,
  verifyRoleInToken,
};
