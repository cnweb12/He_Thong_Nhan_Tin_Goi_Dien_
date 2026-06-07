/**
 * Storage Interface - Abstraction layer for file storage services
 * All storage providers must implement this interface
 */

class StorageInterface {
  /**
   * Upload a file to storage
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {Object} options - Upload options
   * @param {string} options.filename - Original filename
   * @param {string} options.mimetype - File MIME type
   * @param {string} [options.folder] - Optional folder path
   * @param {Object} [options.transformations] - Optional image transformations
   * @returns {Promise<Object>} Upload result with url, filename, size, mimetype
   * @throws {Error} If upload fails
   */
  async uploadFile(fileBuffer, options) {
    throw new Error('uploadFile must be implemented by subclass');
  }

  /**
   * Delete a file from storage
   * @param {string} fileUrl - URL of the file to delete
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails
   */
  async deleteFile(fileUrl) {
    throw new Error('deleteFile must be implemented by subclass');
  }

  /**
   * Get public URL for a file
   * @param {string} filename - Filename or identifier
   * @returns {string} Public URL
   */
  getFileUrl(filename) {
    throw new Error('getFileUrl must be implemented by subclass');
  }

  /**
   * Validate storage configuration
   * @returns {boolean} True if configuration is valid
   * @throws {Error} If configuration is invalid
   */
  validateConfig() {
    throw new Error('validateConfig must be implemented by subclass');
  }
}

module.exports = StorageInterface;
