const cloudinary = require('cloudinary').v2;
const StorageInterface = require('../storage.interface');
const path = require('path');

/**
 * Cloudinary Adapter - Implements Storage Interface for Cloudinary
 */
class CloudinaryAdapter extends StorageInterface {
  constructor(config) {
    super();
    this.config = config;
    this.cloudName = config.cloudName;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.folder = config.folder || 'chat_uploads';
    
    this.validateConfig();
    this.initializeClient();
  }

  /**
   * Initialize Cloudinary client
   */
  initializeClient() {
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  /**
   * Validate Cloudinary configuration
   * @returns {boolean}
   * @throws {Error}
   */
  validateConfig() {
    if (!this.cloudName) {
      throw new Error('Cloudinary cloud name is required');
    }
    if (!this.apiKey) {
      throw new Error('Cloudinary API key is required');
    }
    if (!this.apiSecret) {
      throw new Error('Cloudinary API secret is required');
    }
    return true;
  }

  /**
   * Upload file to Cloudinary
   * @param {Buffer} fileBuffer - File content
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async uploadFile(fileBuffer, options) {
    try {
      const { filename, mimetype, transformations = {} } = options;
      
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const publicId = `${this.folder}/${uniqueSuffix}${path.extname(filename)}`;

      // Prepare upload options
      const uploadOptions = {
        public_id: publicId,
        resource_type: this.getResourceType(mimetype),
        folder: this.folder,
        ...transformations
      };

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(fileBuffer);
      });

      return {
        url: result.secure_url,
        filename: result.public_id,
        size: result.bytes,
        mimetype: mimetype,
        originalname: filename,
        width: result.width,
        height: result.height,
        format: result.format
      };
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} fileUrl - URL of file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(fileUrl) {
    try {
      // Extract public_id from URL
      const publicId = this.extractPublicId(fileUrl);
      
      if (!publicId) {
        throw new Error('Could not extract public ID from URL');
      }

      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
    } catch (error) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  /**
   * Get public URL for file
   * @param {string} filename - Public ID or filename
   * @returns {string} Public URL
   */
  getFileUrl(filename) {
    return cloudinary.url(filename, {
      secure: true,
      resource_type: 'auto'
    });
  }

  /**
   * Determine Cloudinary resource type from MIME type
   * @param {string} mimetype - File MIME type
   * @returns {string} Cloudinary resource type
   */
  getResourceType(mimetype) {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype.startsWith('video/')) {
      return 'video';
    } else if (mimetype.startsWith('audio/')) {
      return 'video'; // Cloudinary uses 'video' for audio
    } else {
      return 'auto';
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string|null} Public ID
   */
  extractPublicId(url) {
    try {
      // Parse URL to extract public ID
      const urlParts = url.split('/');
      const filenameWithExtension = urlParts[urlParts.length - 1];
      const filenameParts = filenameWithExtension.split('.');
      filenameParts.pop(); // Remove extension
      
      // Reconstruct public ID without version
      let publicId = urlParts.slice(urlParts.indexOf('upload') + 2).join('/');
      publicId = publicId.replace(/^v\d+\//, ''); // Remove version if present
      
      return publicId;
    } catch (error) {
      return null;
    }
  }
}

module.exports = CloudinaryAdapter;
