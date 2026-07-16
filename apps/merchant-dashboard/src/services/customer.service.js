import api from './api.js';

export const customerService = {
  getAll: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  },
};

export default customerService;