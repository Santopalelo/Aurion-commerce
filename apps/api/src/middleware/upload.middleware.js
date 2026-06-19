import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/**
 * Upload Middleware
 *
 * Uses Multer to handle multipart/form-data file uploads.
 * Stores files in memory (as buffers) so we can stream them to Cloudinary
 * without ever writing to disk.
 */

// ============================================
// Multer Configuration
// ============================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Only allow images
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type: ${file.mimetype}. Only JPG, PNG, WebP, and GIF are allowed.`,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 10, // Max 10 files per request
  },
});

// ============================================
// EXPORTED MIDDLEWARE
// ============================================

/**
 * Upload a single file
 * Field name in form: must match the name argument
 *
 * Usage:
 *   router.post('/upload', uploadSingle('image'), controller)
 */
export const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    const handler = upload.single(fieldName);
    handler(req, res, (err) => {
      if (err) {
        return handleMulterError(err, next);
      }
      next();
    });
  };
};

/**
 * Upload multiple files under the same field name
 *
 * Usage:
 *   router.post('/upload', uploadMultiple('images', 5), controller)
 */
export const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return (req, res, next) => {
    const handler = upload.array(fieldName, maxCount);
    handler(req, res, (err) => {
      if (err) {
        return handleMulterError(err, next);
      }
      next();
    });
  };
};

/**
 * Upload files from different fields
 *
 * Usage:
 *   router.post('/upload', uploadFields([
 *     { name: 'logo', maxCount: 1 },
 *     { name: 'banner', maxCount: 1 },
 *   ]), controller)
 */
export const uploadFields = (fields) => {
  return (req, res, next) => {
    const handler = upload.fields(fields);
    handler(req, res, (err) => {
      if (err) {
        return handleMulterError(err, next);
      }
      next();
    });
  };
};

// ============================================
// ERROR HANDLER
// ============================================
const handleMulterError = (err, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new ApiError(400, 'File too large. Maximum size is 5 MB.', 'FILE_TOO_LARGE')
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(
        new ApiError(400, 'Too many files uploaded.', 'TOO_MANY_FILES')
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(
        new ApiError(400, `Unexpected field: ${err.field}`, 'UNEXPECTED_FIELD')
      );
    }
  }
  next(err);
};

export default upload;