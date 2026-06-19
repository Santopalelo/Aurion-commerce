import api from './api.js';

/**
 * Authentication Service
 * All auth-related API calls live here
 */

export const authService = {
  /**
   * Register a new merchant
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  /**
   * Log in with email and password
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  /**
   * Log out the current user
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get the current authenticated user
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  /**
   * Refresh access token using refresh token cookie
   */
  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    return response.data.data.accessToken;
  },
};

export default authService;