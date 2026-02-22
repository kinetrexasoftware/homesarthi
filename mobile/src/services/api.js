import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/config';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Errors (e.g. 401)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && (error.response.status === 401)) {
            // Handle token expiration if needed
            // For now, let the store/component handle it
        }
        return Promise.reject(error);
    }
);

export default api;
