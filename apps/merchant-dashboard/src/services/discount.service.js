import api from './api.js';

export const discountService = {
  getAll: async (params = {}) => {
    const response = await api.get('/discounts', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/discounts', data);
    return response.data.data.discount;
  },

  update: async (id, data) => {
    const response = await api.put(`/discounts/${id}`, data);
    return response.data.data.discount;
  },

  delete: async (id) => {
    const response = await api.delete(`/discounts/${id}`);
    return response.data;
  },
};

export default discountService;