/**
 * Standard API Response builder
 * Ensures every response from the API follows the same format
 */
class ApiResponse {
  /**
   * Build a success response
   * @param {string} message - Human-readable message
   * @param {*} data - The response payload
   * @param {object} meta - Optional metadata (pagination, etc)
   */
  static success(message, data = null, meta = null) {
    const response = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  /**
   * Build an error response
   * @param {string} message - Human-readable error message
   * @param {string} errorCode - Machine-readable error code
   * @param {*} details - Optional error details (validation errors, etc)
   */
  static error(message, errorCode = 'INTERNAL_ERROR', details = null) {
    const response = {
      success: false,
      message,
      error: errorCode,
    };

    if (details) {
      response.details = details;
    }

    return response;
  }
}

export default ApiResponse;