import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth Store
 *
 * Manages authentication state across the entire app.
 * Uses Zustand with localStorage persistence.
 */

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Set authenticated user and token
       */
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      },

      /**
       * Update user data (e.g., after profile update)
       */
      setUser: (user) => {
        set({ user });
      },

      /**
       * Clear auth state on logout
       */
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'aurion-auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // Only persist user, not loading state
    }
  )
);

export default useAuthStore;