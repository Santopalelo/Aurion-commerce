import ApiError from '../utils/ApiError.js';

/**
 * Validation middleware factory
 * Takes a Joi schema and returns a middleware that validates req.body
 *
 * Usage in routes:
 *   router.post('/register', validate(registerSchema), authController.register);
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Return ALL errors, not just the first
      stripUnknown: true, // Remove unknown fields
      convert: true, // Auto-convert types when possible
    });

    if (error) {
      // Format Joi errors into clean structure
      const details = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new ApiError(
        400,
        'Validation failed',
        'VALIDATION_ERROR',
        details
      );
    }

    // Replace with validated/sanitized data
    req[source] = value;
    next();
  };
};

export default validate;