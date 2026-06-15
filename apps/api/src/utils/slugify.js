import slugifyLib from 'slugify';

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
 * If the slug exists, appends -2, -3, etc until unique
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

  // Keep checking until we find a unique slug
  while (true) {
    const query = { [field]: slug, ...extraQuery };
    const existing = await Model.findOne(query);

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety check to prevent infinite loop
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      return slug;
    }
  }
};

export default generateSlug;