import api from './api.js';

/**
 * Order Service
 * All order-related API calls
 */

export const orderService = {
  /**
   * Get all orders with filters
   */
  getAll: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  /**
   * Get single order by ID
   */
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data.order;
  },

  /**
   * Get order stats
   */
  getStats: async (period = '30d') => {
    const response = await api.get('/orders/stats/overview', {
      params: { period },
    });
    return response.data.data;
  },

  /**
   * Update order status
   */
  updateStatus: async (id, status, note = '') => {
    const response = await api.put(`/orders/${id}/status`, { status, note });
    return response.data.data.order;
  },

  /**
   * Update fulfillment info (tracking, carrier, etc.)
   */
  updateFulfillment: async (id, data) => {
    const response = await api.put(`/orders/${id}/fulfillment`, data);
    return response.data.data.order;
  },

  /**
   * Add merchant note to order
   */
  addNote: async (id, note) => {
    const response = await api.post(`/orders/${id}/notes`, { note });
    return response.data.data;
  },

  /**
   * Cancel order
   */
  cancel: async (id, reason = '', restockItems = true) => {
    const response = await api.post(`/orders/${id}/cancel`, {
      reason,
      restockItems,
    });
    return response.data.data.order;
  },
};

export default orderService;