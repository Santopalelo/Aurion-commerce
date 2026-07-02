import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to attach customer auth token
 */
const withAuth = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

/**
 * Storefront API methods
 */
export const storefrontApi = {
  // ============================================
  // STORE + PRODUCTS
  // ============================================
  getStore: async (storeSlug) => {
    const { data } = await api.get(`/storefront/${storeSlug}`);
    return data.data;
  },

  getProducts: async (storeSlug, params = {}) => {
    const { data } = await api.get(`/storefront/${storeSlug}/products`, {
      params,
    });
    return data;
  },

  getProduct: async (storeSlug, productSlug) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/products/${productSlug}`
    );
    return data.data;
  },

  getCategories: async (storeSlug) => {
    const { data } = await api.get(`/storefront/${storeSlug}/categories`);
    return data.data;
  },

  getCategory: async (storeSlug, categorySlug, params = {}) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/categories/${categorySlug}`,
      { params }
    );
    return data.data;
  },

  // ============================================
  // PAYMENTS
  // ============================================
  createPaymentIntent: async (storeSlug, payload) => {
    const { data } = await api.post(
      `/storefront/${storeSlug}/payment/create-intent`,
      payload
    );
    return data.data;
  },

  // ============================================
  // ORDERS
  // ============================================
  createOrder: async (storeSlug, payload) => {
    const { data } = await api.post(
      `/storefront/${storeSlug}/orders/create`,
      payload
    );
    return data.data;
  },

  getOrder: async (storeSlug, orderNumber, email) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/orders/${orderNumber}`,
      { params: { email } }
    );
    return data.data;
  },

  // ============================================
  // CUSTOMER AUTH
  // ============================================
  registerCustomer: async (storeSlug, payload) => {
    const { data } = await api.post(
      `/storefront/${storeSlug}/customers/register`,
      payload
    );
    return data.data;
  },

  loginCustomer: async (storeSlug, email, password) => {
    const { data } = await api.post(
      `/storefront/${storeSlug}/customers/login`,
      { email, password }
    );
    return data.data;
  },

  // ============================================
  // CUSTOMER PROFILE (require auth token)
  // ============================================
  getMyProfile: async (storeSlug, token) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/customers/me`,
      withAuth(token)
    );
    return data.data.customer;
  },

  updateProfile: async (storeSlug, token, payload) => {
    const { data } = await api.put(
      `/storefront/${storeSlug}/customers/me`,
      payload,
      withAuth(token)
    );
    return data.data.customer;
  },

  changePassword: async (storeSlug, token, payload) => {
    const { data } = await api.put(
      `/storefront/${storeSlug}/customers/me/password`,
      payload,
      withAuth(token)
    );
    return data;
  },

  getMyOrders: async (storeSlug, token, params = {}) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/customers/me/orders`,
      { ...withAuth(token), params }
    );
    return data;
  },

  getMyAddresses: async (storeSlug, token) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/customers/me/addresses`,
      withAuth(token)
    );
    return data.data.addresses;
  },

  addAddress: async (storeSlug, token, payload) => {
    const { data } = await api.post(
      `/storefront/${storeSlug}/customers/me/addresses`,
      payload,
      withAuth(token)
    );
    return data.data.addresses;
  },

  deleteAddress: async (storeSlug, token, addressId) => {
    const { data } = await api.delete(
      `/storefront/${storeSlug}/customers/me/addresses/${addressId}`,
      withAuth(token)
    );
    return data.data.addresses;
  },

  setDefaultAddress: async (storeSlug, token, addressId) => {
    const { data } = await api.put(
      `/storefront/${storeSlug}/customers/me/addresses/${addressId}/default`,
      {},
      withAuth(token)
    );
    return data.data.addresses;
  },
};

export default api;