import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Customer Auth Store
 *
 * Manages customer login state PER STORE.
 * A user could be logged in at Store A but not Store B.
 *
 * Structure: {
 *   sessions: {
 *     'johns-sneakers': { customer: {...}, token: '...' },
 *     'janes-boutique': { customer: {...}, token: '...' }
 *   }
 * }
 */

const useCustomerAuthStore = create(
  persist(
    (set, get) => ({
      // Per-store sessions
      sessions: {},

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Set auth session for a specific store
       */
      setSession: (storeSlug, customer, token) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [storeSlug]: { customer, token },
          },
        }));
      },

      /**
       * Update customer data for a store
       */
      updateCustomer: (storeSlug, customer) => {
        set((state) => {
          const currentSession = state.sessions[storeSlug];
          if (!currentSession) return state;

          return {
            sessions: {
              ...state.sessions,
              [storeSlug]: { ...currentSession, customer },
            },
          };
        });
      },

      /**
       * Clear session for a store (logout)
       */
      clearSession: (storeSlug) => {
        set((state) => {
          const newSessions = { ...state.sessions };
          delete newSessions[storeSlug];
          return { sessions: newSessions };
        });
      },

      // ============================================
      // SELECTORS
      // ============================================

      /**
       * Get customer for a store
       */
      getCustomer: (storeSlug) => {
        return get().sessions[storeSlug]?.customer || null;
      },

      /**
       * Get token for a store
       */
      getToken: (storeSlug) => {
        return get().sessions[storeSlug]?.token || null;
      },

      /**
       * Check if customer is logged in for a store
       */
      isAuthenticated: (storeSlug) => {
        return !!get().sessions[storeSlug]?.token;
      },
    }),
    {
      name: 'aurion-customer-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCustomerAuthStore;