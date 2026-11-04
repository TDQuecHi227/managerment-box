const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const cloudinary = require('cloudinary').v2;

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  return cloudinary;
}

/**
 * Xóa dấu tiếng Việt và ký tự đặc biệt để làm tên file sạch
 */
function removeVietnameseTones(str) {
  if (!str) return 'member';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'member';
}

/**
 * Upload buffer trực tiếp lên Cloudinary mà không cần lưu ổ đĩa
 * @param {Buffer} fileBuffer
 * @param {Object} options
 * @param {string} options.folder
 * @param {string} options.public_id
 * @returns {Promise<Object>}
 */
function uploadToCloudinary(fileBuffer, { folder = 'caisbang_donations', public_id }) {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id,
        resource_type: 'image',
        overwrite: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

module.exports = {
  cloudinary,
  removeVietnameseTones,
  uploadToCloudinary
};

