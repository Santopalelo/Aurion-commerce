import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

/**
 * Cloudinary Configuration
 *
 * Initialized once at server startup.
 * Used by storage.service.js to upload/delete files.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});

// Verify configuration on startup
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    '⚠️  Cloudinary credentials not set. Image uploads will fail.'
  );
} else {
  console.log('✅ Cloudinary configured');
}

export default cloudinary;