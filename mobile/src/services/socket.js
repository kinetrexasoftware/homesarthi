import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

let socket = null;

// Get the base URL (e.g. http://10.127.245.46:5000) from API_URL (http://10.127.245.46:5000/api)
const SOCKET_URL = API_URL.replace('/api', '');

export const initSocket = async (userId) => {
    if (socket?.connected) {
        return socket;
    }

    const token = await SecureStore.getItemAsync('token');
    if (!token) {
        console.warn('No token found, cannot initialize socket');
        return null;
    }

    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
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
