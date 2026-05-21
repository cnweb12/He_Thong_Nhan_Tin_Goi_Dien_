/**
 * Generate realistic test data for integration tests
 */

const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang'];
const lastNames = ['Van', 'Thi', 'Minh', 'Quoc', 'Ngoc', 'Hai', 'Duy', 'Anh', 'Bao', 'Chau'];
const displayNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];

/**
 * Generate a random phone number (Vietnamese format: 84xxxxxxxxx)
 * @returns {string} Phone number
 */
function generatePhone() {
  const randomPart = Math.floor(Math.random() * 900000000 + 100000000);
  return `84${randomPart}`;
}

/**
 * Generate a random display name
 * @returns {string} Display name
 */
function generateDisplayName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const englishName = displayNames[Math.floor(Math.random() * displayNames.length)];
  return `${firstName} ${lastName} (${englishName})`;
}

/**
 * Generate a random password
 * @returns {string} Password
 */
function generatePassword() {
  return `Password${Math.floor(Math.random() * 10000)}!`;
}

/**
 * Generate a random device ID
 * @returns {string} Device ID
 */
function generateDeviceId() {
  return `device-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a user registration payload
 * @param {Object} overrides - Override default values
 * @returns {Object} User registration data
 */
function createUserRegistrationData(overrides = {}) {
  return {
    phone: generatePhone(),
    password: generatePassword(),
    displayName: generateDisplayName(),
    ...overrides,
  };
}

/**
 * Create multiple user registration data
 * @param {number} count - Number of users to create
 * @returns {Array<Object>} Array of user registration data
 */
function createMultipleUserRegistrationData(count = 2) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(createUserRegistrationData());
  }
  return users;
}

/**
 * Create a login payload
 * @param {string} phone - Phone number
 * @param {string} password - Password
 * @param {string} deviceId - Device ID
 * @returns {Object} Login data
 */
function createLoginData(phone, password, deviceId) {
  return {
    phone,
    password,
    deviceId: deviceId || generateDeviceId(),
  };
}

/**
 * Create a message payload
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message content
 * @returns {Object} Message data
 */
function createMessageData(conversationId, content) {
  return {
    conversationId,
    content: content || 'Hello, this is a test message!',
  };
}

/**
 * Create a direct conversation payload
 * @param {string} participantId - Participant user ID
 * @returns {Object} Conversation data
 */
function createDirectConversationData(participantId) {
  return {
    participantId,
  };
}

/**
 * Create a call payload
 * @param {string} conversationId - Conversation ID
 * @param {string} type - Call type (audio/video)
 * @returns {Object} Call data
 */
function createCallData(conversationId, type = 'audio') {
  return {
    conversationId,
    type,
  };
}

/**
 * Create a device payload
 * @param {string} deviceId - Device ID
 * @param {string} deviceType - Device type (mobile/desktop/web)
 * @param {string} deviceName - Device name
 * @returns {Object} Device data
 */
function createDeviceData(deviceId, deviceType = 'mobile', deviceName = 'Test Device') {
  return {
    deviceId,
    deviceType,
    deviceName,
    osVersion: '1.0.0',
    appVersion: '1.0.0',
  };
}

/**
 * Create a user settings payload
 * @param {Object} settings - Settings object
 * @returns {Object} User settings data
 */
function createSettingsData(settings = {}) {
  return {
    theme: 'light',
    notifications: true,
    language: 'vi',
    ...settings,
  };
}

/**
 * Create a profile update payload
 * @param {Object} profileData - Profile data
 * @returns {Object} Profile update data
 */
function createProfileUpdateData(profileData = {}) {
  return {
    displayName: generateDisplayName(),
    avatar: null,
    status: 'online',
    ...profileData,
  };
}

/**
 * Create a password change payload
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Password change data
 */
function createPasswordChangeData(currentPassword, newPassword) {
  return {
    currentPassword,
    newPassword,
    confirmPassword: newPassword,
  };
}

module.exports = {
  generatePhone,
  generateDisplayName,
  generatePassword,
  generateDeviceId,
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
};
