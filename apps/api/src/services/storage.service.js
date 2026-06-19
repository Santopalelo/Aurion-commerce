import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

/**
 * Storage Service
 *
 * Handles all file uploads and deletions via Cloudinary.
 * Centralizes the logic so controllers stay clean.
 */

const PLATFORM_FOLDER = 'aurion-commerce';

/**
 * Upload a file buffer to Cloudinary
 *
 * @param {Buffer} buffer - The file buffer from Multer
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path
 * @param {string} options.resourceType - 'image', 'video', 'raw', or 'auto'
 * @param {object} options.transformation - Cloudinary transformations
 * @returns {Promise<{url, publicId, width, height, format, bytes}>}
 */
export const uploadBuffer = (buffer, options = {}) => {
  const {
    folder,
    resourceType = 'image',
    transformation = [],
  } = options;

  if (!folder) {
    throw new ApiError(500, 'Upload folder is required', 'UPLOAD_ERROR');
  }

  // Cloudinary doesn't support direct buffer upload — we use a stream
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${PLATFORM_FOLDER}/${folder}`,
        resource_type: resourceType,
        transformation,
      },
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(
              500,
              `Upload failed: ${error.message}`,
              'UPLOAD_FAILED',
              { cloudinaryError: error }
            )
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload an image for a product
 *
 * @param {Buffer} buffer
 * @param {string} storeId
 * @param {string} productId
 */
export const uploadProductImage = async (buffer, storeId, productId) => {
  return uploadBuffer(buffer, {
    folder: `stores/${storeId}/products/${productId}`,
    transformation: [
      // Auto-optimize: quality, format
      { quality: 'auto', fetch_format: 'auto' },
      // Max dimensions (keeps aspect ratio)
      { width: 2000, height: 2000, crop: 'limit' },
    ],
  });
};

/**
 * Upload a category image
 */
export const uploadCategoryImage = async (buffer, storeId) => {
  return uploadBuffer(buffer, {
    folder: `stores/${storeId}/categories`,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1200, height: 1200, crop: 'limit' },
    ],
  });
};

/**
 * Upload a store logo
 */
export const uploadStoreLogo = async (buffer, storeId) => {
  return uploadBuffer(buffer, {
    folder: `stores/${storeId}/logo`,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 500, height: 500, crop: 'limit' },
    ],
  });
};

/**
 * Upload a store banner
 */
export const uploadStoreBanner = async (buffer, storeId) => {
  return uploadBuffer(buffer, {
    folder: `stores/${storeId}/banner`,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 2000, height: 800, crop: 'limit' },
    ],
  });
};

/**
 * Upload a user avatar
 */
export const uploadUserAvatar = async (buffer, userId) => {
  return uploadBuffer(buffer, {
    folder: `users/${userId}/avatar`,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    ],
  });
};

/**
 * Delete a file from Cloudinary
 *
 * @param {string} publicId - The public_id returned during upload
 * @param {string} resourceType - 'image', 'video', 'raw'
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    // Log but don't throw — deletion failure shouldn't break the app
    console.error(`Failed to delete Cloudinary file ${publicId}:`, error.message);
    return null;
  }
};

/**
 * Delete multiple files at once
 */
export const deleteFiles = async (publicIds, resourceType = 'image') => {
  if (!publicIds || publicIds.length === 0) return;

  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Failed to delete multiple Cloudinary files:', error.message);
    return null;
  }
};

/**
 * Generate optimized URL with transformations
 *
 * Useful for displaying images at specific sizes without re-uploading
 *
 * @param {string} publicId
 * @param {object} transformations
 */
export const getOptimizedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto',
    fetch_format: 'auto',
    ...transformations,
  });
};

export default {
  uploadBuffer,
  uploadProductImage,
  uploadCategoryImage,
  uploadStoreLogo,
  uploadStoreBanner,
  uploadUserAvatar,
  deleteFile,
  deleteFiles,
  getOptimizedUrl,
};