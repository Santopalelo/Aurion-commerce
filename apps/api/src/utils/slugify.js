import slugifyLib from 'slugify';
import mongoose from 'mongoose';

/**
 * Generate a URL-safe slug from a string
 *
 * Examples:
 *   "John's Sneakers" → "johns-sneakers"
 *   "ABC 123 & XYZ"   → "abc-123-and-xyz"
 *   "  Hello World  " → "hello-world"
 */
export const generateSlug = (text) => {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
  });
};

/**
 * Generate a unique slug by checking against a model
 * If the slug exists, appends -2, -3, etc until unique.
 * Uses retry-on-duplicate-key to handle race conditions.
 *
 * @param {string} text - The text to slugify
 * @param {Model} Model - Mongoose model to check against
 * @param {string} field - Field name to check (e.g., 'slug')
 * @param {object} extraQuery - Additional query conditions (e.g., { store: storeId })
 * @returns {Promise<string>} Unique slug
 */
export const generateUniqueSlug = async (text, Model, field = 'slug', extraQuery = {}) => {
  let baseSlug = generateSlug(text);

  if (!baseSlug) {
    baseSlug = 'item';
  }

  let slug = baseSlug;
  let counter = 2;

  // Try up to 5 times with incrementing suffixes
  // If we hit a duplicate key error (race condition), retry with next suffix
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const query = { [field]: slug, ...extraQuery };
      const existing = await Model.findOne(query);

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    } catch (error) {
      // If it's a duplicate key error from a concurrent insert, retry
      if (error.code === 11000) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        continue;
      }
      throw error;
    }
  }

  // Fallback: use timestamp to guarantee uniqueness
  return `${baseSlug}-${Date.now()}`;
};

export default generateSlug;