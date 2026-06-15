/**
 * Custom API Error class
 * Use this throughout the app to throw consistent errors
 *
 * Example: throw new ApiError(404, 'Product not found', 'NOT_FOUND');
 */
class ApiError extends Error {
  constructor(statusCode, message, errorCode = null, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.details = details;
    this.success = false;
    this.isOperational = true; // Distinguishes our errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;