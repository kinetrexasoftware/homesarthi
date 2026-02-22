import { create } from 'zustand';

const useRoomStore = create((set) => ({
    rooms: [],
    selectedRoom: null,
    filters: {
        minRent: '',
        maxRent: '',
        roomType: '',
        amenities: [],
        genderPreference: '',
        latitude: '',
        longitude: '',
        radius: 10000,
    },
    pagination: {
        page: 1,
        limit: 12,
        total: 0,
        pages: 0,
    },

    setRooms: (rooms) => set({ rooms }),

    setSelectedRoom: (room) => set({ selectedRoom: room }),

    setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
    })),

    setPagination: (pagination) => set({ pagination }),

    resetFilters: () => set({
        filters: {
            minRent: '',
            maxRent: '',
            roomType: '',
            amenities: [],
            genderPreference: '',
            latitude: '',
            longitude: '',
            radius: 10000,
        }
    }),
}));

export default useRoomStore;
