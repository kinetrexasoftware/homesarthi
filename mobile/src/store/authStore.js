import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,

    setAuth: async (user, token) => {
        try {
            if (!token || !user) throw new Error('Invalid auth data');
            await SecureStore.setItemAsync('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            set({ user, token, isAuthenticated: true, loading: false });
        } catch (error) {
            console.error('Error saving auth:', error);
        }
    },

    logout: async () => {
        try {
            await SecureStore.deleteItemAsync('token');
            await AsyncStorage.removeItem('user');
            set({ user: null, token: null, isAuthenticated: false, loading: false });
        } catch (error) {
            console.error('Error clearing auth:', error);
        }
    },

    updateUser: (userData) => {
        set((state) => ({
            user: state?.user ? { ...state.user, ...userData } : userData
        }));
    },

    refreshUser: async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            const { data } = await api.get('/users/me');
            if (data?.success) {
                const user = data.data.user;
                await AsyncStorage.setItem('user', JSON.stringify(user));
                set({ user, isAuthenticated: true, loading: false });
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            if (error?.response?.status === 401) {
                const logout = get()?.logout;
                if (logout) await logout();
            }
        }
    },

    checkSession: async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const userStr = await AsyncStorage.getItem('user');

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    set({ token, user, isAuthenticated: true, loading: false });
                    // Async refresh in background
                    get().refreshUser();
                } catch (e) {
                    console.error('Failed to parse stored user');
                    const logout = get()?.logout;
                    if (logout) await logout();
                }
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error('Error checking session:', error);
            set({ loading: false });
        }
    }
}));

export default useAuthStore;
