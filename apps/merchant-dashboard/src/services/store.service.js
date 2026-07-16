import api from './api.js';

export const storeService = {
  getMyStore: async () => {
    const response = await api.get('/stores/my-store');
    return response.data.data;
  },

  updateMyStore: async (data) => {
    const response = await api.put('/stores/my-store', data);
    return response.data.data.store;
  },
};

export default storeService;