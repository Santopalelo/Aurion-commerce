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
 * Storefront API methods
 * All endpoints are PUBLIC (no auth required)
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
};

export default api;