import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, SERVER_URL } from '../constants/config';

let socket = null;



export const initSocket = async (userId) => {
    if (socket?.connected) {
        return socket;
    }

    const token = await SecureStore.getItemAsync('token');
    if (!token) {
        console.warn('No token found, cannot initialize socket');
        return null;
    }

    // Determine Socket URL safely
    const finalSocketUrl = SERVER_URL || API_URL.replace('/api', '');
    console.log(`[Socket] Initializing connection to: ${finalSocketUrl}`);

    socket = io(finalSocketUrl, {
        transports: ['polling', 'websocket'], // Try polling first for better compatibility with VPS proxies
        auth: { token },
        reconnection: true,
        reconnectionDelay: 5000, // Wait 5s between retries to reduce UI clutter
        reconnectionAttempts: 10,
        secure: true,
        timeout: 20000,
        path: '/socket.io/'
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        if (userId) {
            socket.emit('user_online', userId);
        }
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

export const getSocket = async () => {
    if (!socket || !socket.connected) {
        try {
            const userStr = await AsyncStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user?._id || user?.id;
            if (userId) {
                return await initSocket(userId);
            }
        } catch (e) {
            console.error('Error getting user for socket:', e);
        }
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
