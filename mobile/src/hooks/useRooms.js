import { useState, useCallback } from 'react';
import useRoomStore from '../store/roomStore';
import api from '../services/api';
import { Alert } from 'react-native';

export const useRooms = () => {
    const {
        rooms,
        selectedRoom,
        setRooms,
        setSelectedRoom,
        filters,
        setFilters,
        pagination,
        setPagination,
        resetFilters
    } = useRoomStore();

    const [loading, setLoading] = useState(false);

    const fetchRooms = useCallback(async (customFilters = {}) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                ...filters,
                ...customFilters,
                page: pagination.page,
                limit: pagination.limit
            });

            // Clean up empty params
            Object.keys(params).forEach(key => {
                if (!params.get(key)) params.delete(key);
            });

            const { data } = await api.get(`/rooms?${params.toString()}`);
            if (data?.success) {
                // Adjust based on common backend response structure
                const roomList = data.data.rooms || data.data;
                setRooms(Array.isArray(roomList) ? roomList : []);

                if (data.data.pagination) {
                    setPagination(data.data.pagination);
                }
            }
            return data;
        } catch (error) {
            console.error('Fetch rooms error:', error);
            Alert.alert('Error', 'Failed to fetch rooms');
            return null;
        } finally {
            setLoading(false);
        }
    }, [filters, pagination, setRooms, setPagination]);

    const fetchRoomById = useCallback(async (roomId) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/rooms/${roomId}`);
            if (data?.success) {
                setSelectedRoom(data.data.room || data.data);
            }
            return data;
        } catch (error) {
            console.error('Fetch room error:', error);
            Alert.alert('Error', 'Failed to fetch room details');
            return null;
        } finally {
            setLoading(false);
        }
    }, [setSelectedRoom]);

    const createRoom = async (roomData) => {
        try {
            setLoading(true);
            const { data } = await api.post('/rooms', roomData);
            if (data?.success) {
                Alert.alert('Success', 'Room created successfully');
            }
            return data;
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create room');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        rooms,
        selectedRoom,
        loading,
        filters,
        pagination,
        fetchRooms,
        fetchRoomById,
        createRoom,
        setFilters,
        resetFilters
    };
};
