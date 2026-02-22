import { useState, useEffect } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export const useRooms = () => {
  const {
    rooms,
    currentRoom,
    myRooms,
    favorites,
    loading,
    setRooms,
    setCurrentRoom,
    setMyRooms,
    setFavorites,
    setLoading,
    addRoom,
    updateRoom,
    removeRoom,
    addToFavorites,
    removeFromFavorites
  } = useRoomStore();

  const [filters, setFilters] = useState({
    search: '',
    city: '',
    roomType: '',
    minRent: '',
    maxRent: '',
    amenities: [],
    genderPreference: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
    totalRooms: 0
  });

  // Fetch all available rooms with filters
  const fetchRooms = async (searchFilters = {}, page = 1) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...filters,
        ...searchFilters
      });

      // Remove empty filters
      Object.keys(queryParams).forEach(key => {
        if (!queryParams.get(key)) {
          queryParams.delete(key);
        }
      });

      const response = await api.get(`/rooms?${queryParams}`);
      const { rooms: fetchedRooms, totalPages, totalRooms: total, currentPage } = response.data.data;

      setRooms(fetchedRooms);
      setPagination({
        ...pagination,
        page: currentPage,
        totalPages,
        totalRooms: total
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch rooms';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch single room by ID
  const fetchRoomById = async (roomId) => {
    try {
      setLoading(true);
      const response = await api.get(`/rooms/${roomId}`);
      // Backend returns: { success, data: { room } }
      const room = response.data.data?.room;

      setCurrentRoom(room);
      return { success: true, data: room };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch room';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch owner's rooms
  const fetchMyRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms/my-rooms');
      // Backend returns: { success, data: { rooms: [...] } }
      const rooms = response.data.data?.rooms || [];

      setMyRooms(rooms);
      return { success: true, data: rooms };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch your rooms';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Create new room
  const createRoom = async (roomData) => {
    try {
      setLoading(true);
      const response = await api.post('/rooms', roomData);
      const newRoom = response.data.data;

      addRoom(newRoom);
      toast.success('Room created successfully!');
      return { success: true, data: newRoom };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create room';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Update room
  const updateRoomById = async (roomId, roomData) => {
    try {
      setLoading(true);
      const response = await api.put(`/rooms/${roomId}`, roomData);
      const updatedRoom = response.data.data;

      updateRoom(roomId, updatedRoom);
      toast.success('Room updated successfully!');
      return { success: true, data: updatedRoom };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update room';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Delete room
  const deleteRoom = async (roomId) => {
    try {
      setLoading(true);
      await api.delete(`/rooms/${roomId}`);

      removeRoom(roomId);
      toast.success('Room deleted successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete room';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (roomId) => {
    try {
      const response = await api.post(`/rooms/${roomId}/favorite`);
      const { isFavorited } = response.data.data;

      if (isFavorited) {
        addToFavorites(roomId);
        toast.success('Added to favorites!');
      } else {
        removeFromFavorites(roomId);
        toast.success('Removed from favorites!');
      }

      return { success: true, isFavorited };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update favorite';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms/favorites');
      const favoriteRooms = response.data.data;

      setFavorites(favoriteRooms);
      return { success: true, data: favoriteRooms };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch favorites';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Search rooms
  const searchRooms = async (searchQuery, searchFilters = {}) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        search: searchQuery,
        ...searchFilters
      });

      const response = await api.get(`/rooms/search?${queryParams}`);
      const { rooms: searchResults, totalPages, totalRooms: total } = response.data.data;

      setRooms(searchResults);
      setPagination({
        ...pagination,
        page: 1,
        totalPages,
        totalRooms: total
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Search failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Get nearby rooms
  const getNearbyRooms = async (longitude, latitude, maxDistance = 10000) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        lng: longitude,
        lat: latitude,
        maxDistance
      });

      const response = await api.get(`/rooms/nearby?${queryParams}`);
      const nearbyRooms = response.data.data;

      setRooms(nearbyRooms);
      return { success: true, data: nearbyRooms };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch nearby rooms';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Increment room views
  const incrementRoomViews = async (roomId) => {
    try {
      await api.post(`/rooms/${roomId}/view`);
      // Update local state if needed
      const room = rooms.find(r => r._id === roomId);
      if (room) {
        updateRoom(roomId, { ...room, stats: { ...room.stats, views: room.stats.views + 1 } });
      }
    } catch (error) {
      // Silently fail for view tracking
      console.error('Failed to track view:', error);
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      roomType: '',
      minRent: '',
      maxRent: '',
      amenities: [],
      genderPreference: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Change page
  const changePage = (page) => {
    setPagination({ ...pagination, page });
    fetchRooms({}, page);
  };

  return {
    // State
    rooms,
    currentRoom,
    myRooms,
    favorites,
    loading,
    filters,
    pagination,

    // Actions
    fetchRooms,
    fetchRoomById,
    fetchMyRooms,
    createRoom,
    updateRoomById,
    deleteRoom,
    toggleFavorite,
    fetchFavorites,
    searchRooms,
    getNearbyRooms,
    incrementRoomViews,

    // Filter actions
    updateFilters,
    clearFilters,
    changePage,

    // Utilities
    setFilters,
    setPagination
  };
};
