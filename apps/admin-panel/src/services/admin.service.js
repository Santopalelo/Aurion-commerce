import api from './api.js';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Verify user is admin
    if (data.data.user.platformRole !== 'platform_admin') {
      throw new Error('Admin access required');
    }
    return data.data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },
};

export const adminService = {
  getDashboard: async () => {
    const { data } = await api.get('/admin/dashboard');
    return data.data;
  },

  getStores: async (params = {}) => {
    const { data } = await api.get('/admin/stores', { params });
    return data;
  },

  getStoreDetail: async (id) => {
    const { data } = await api.get(`/admin/stores/${id}`);
    return data.data;
  },

  updateStoreStatus: async (id, status, reason) => {
    const { data } = await api.put(`/admin/stores/${id}/status`, {
      status,
      reason,
    });
    return data.data;
  },

  getUsers: async (params = {}) => {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  suspendUser: async (id, reason) => {
    const { data } = await api.put(`/admin/users/${id}/suspend`, { reason });
    return data.data;
  },

  unsuspendUser: async (id) => {
    const { data } = await api.put(`/admin/users/${id}/unsuspend`);
    return data.data;
  },

  getRevenueAnalytics: async (period = '30d') => {
    const { data } = await api.get('/admin/analytics/revenue', {
      params: { period },
    });
    return data.data;
  },
};