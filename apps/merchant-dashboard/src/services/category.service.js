import api from './api.js';

/**
 * Category Service
 * All category-related API calls
 */

export const categoryService = {
  /**
   * Get all categories with optional filters
   */
  getAll: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  /**
   * Get single category by ID
   */
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },

  /**
   * Create a new category
   * Uses FormData if image is provided, JSON otherwise
   */
  create: async (data, imageFile = null) => {
    if (imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });
      formData.append('image', imageFile);

      const response = await api.post('/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data.category;
    }

    const response = await api.post('/categories', data);
    return response.data.data.category;
  },

  /**
   * Update a category
   */
  update: async (id, data, imageFile = null) => {
    if (imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });
      formData.append('image', imageFile);

      const response = await api.put(`/categories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data.category;
    }

    const response = await api.put(`/categories/${id}`, data);
    return response.data.data.category;
  },

  /**
   * Delete a category
   */
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Delete only the category image
   */
  deleteImage: async (id) => {
    const response = await api.delete(`/categories/${id}/image`);
    return response.data.data.category;
  },
};

export default categoryService;