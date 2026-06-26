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
 * Storefront API methods (PUBLIC, no auth required)
 */
export const storefrontApi = {
  /**
   * Get store info
   */
  getStore: async (storeSlug) => {
    const { data } = await api.get(`/storefront/${storeSlug}`);
    return data.data;
  },

  /**
   * Get products with filters
   */
  getProducts: async (storeSlug, params = {}) => {
    const { data } = await api.get(`/storefront/${storeSlug}/products`, {
      params,
    });
    return data;
  },

  /**
   * Get single product by slug
   */
  getProduct: async (storeSlug, productSlug) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/products/${productSlug}`
    );
    return data.data;
  },

  /**
   * Get all categories
   */
  getCategories: async (storeSlug) => {
    const { data } = await api.get(`/storefront/${storeSlug}/categories`);
    return data.data;
  },

  /**
   * Get category with its products
   */
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

  /**
   * Create a Stripe Payment Intent
   */
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

  /**
   * Create an order after successful payment
   */
  createOrder: async (storeSlug, payload) => {
    const { data } = await api.post(
      `/storefront/${storeSlug}/orders/create`,
      payload
    );
    return data.data;
  },

  /**
   * Get order details by order number
   */
  getOrder: async (storeSlug, orderNumber, email) => {
    const { data } = await api.get(
      `/storefront/${storeSlug}/orders/${orderNumber}`,
      { params: { email } }
    );
    return data.data;
  },
};

export default api;