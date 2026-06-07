/**
 * Upload controller
 */

const CloudinaryAdapter = require('../../../common/storage/adapters/cloudinary.adapter');
const config = require('../../../config/env');

// Initialize storage adapter
let storageAdapter = null;

function getStorageAdapter() {
  if (!storageAdapter) {
    // Check if Cloudinary configuration is available
    if (config.cloudinary?.cloudName && config.cloudinary?.apiKey && config.cloudinary?.apiSecret) {
      storageAdapter = new CloudinaryAdapter(config.cloudinary);
    } else {
      throw new Error('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }
  }
  return storageAdapter;
}

async function uploadFiles(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      const error = new Error("No files uploaded");
      error.statusCode = 400;
      return next(error);
    }

    const storage = getStorageAdapter();

    // Upload all files using storage adapter
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await storage.uploadFile(file.buffer, {
          filename: file.originalname,
          mimetype: file.mimetype,
        });
        return result;
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        throw error;
      }
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(201).json({
      ok: true,
      data: uploadedFiles,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadFiles,
};
