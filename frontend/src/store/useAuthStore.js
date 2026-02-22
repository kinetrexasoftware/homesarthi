import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : userData
        }));
      },

      calculateCompletion: (user) => {
        if (!user) return 0;
        let score = 0;
        if (user.name) score += 30;
        if (user.avatar?.url) score += 40;
        if (user.bio) score += 30;
        return score;
      },

      refreshUser: async () => {
        try {
          const { data } = await api.get('/users/me');
          if (data.success) {
            set({ user: data.data.user });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          if (error.response?.status === 401) {
            set({ user: null, token: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
