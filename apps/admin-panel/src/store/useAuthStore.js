import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (admin, accessToken) => {
        localStorage.setItem('adminAccessToken', accessToken);
        set({ admin, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('adminAccessToken');
        set({ admin: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'aurion-admin-auth',
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;