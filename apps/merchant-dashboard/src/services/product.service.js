import api from './api.js';

/**
 * Product Service
 * All product-related API calls
 */

export const productService = {
  /**
   * Get all products with filters
   */
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  /**
   * Get single product by ID
   */
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data.data.product;
  },

  /**
   * Create a new product
   * @param {object} data - Product data
   * @param {File[]} imageFiles - Optional array of image files
   */
  create: async (data, imageFiles = []) => {
    const formData = new FormData();

    // Append simple fields
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;

      // Stringify objects and arrays
      if (typeof value === 'object' && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    // Append image files
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.product;
  },

  /**
   * Update a product
   */
  update: async (id, data, imageFiles = [], imagesToDelete = []) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;

      if (typeof value === 'object' && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    if (imagesToDelete.length > 0) {
      formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }

    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.product;
  },

  /**
   * Delete a product
   */
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Duplicate a product
   */
  duplicate: async (id) => {
    const response = await api.post(`/products/${id}/duplicate`);
    return response.data.data.product;
  },

  /**
   * Update only the status (quick toggle)
   */
  updateStatus: async (id, status) => {
    const response = await api.put(`/products/${id}/status`, { status });
    return response.data.data.product;
  },
};

export default productService;