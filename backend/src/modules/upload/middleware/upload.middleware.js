const multer = require('multer');

// Use memory storage to keep files in RAM for Cloudinary upload
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
