import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import FreeMapView from '../common/FreeMapView';

const { width } = Dimensions.get('window');

const GlobalMapView = ({
    rooms,
    selectedRoom,
    onRoomSelect,
    height = 400,
    navigation,
    onRegionChange
}) => {
    const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null);

    // Current center (default to first room or Delhi)
    const center = selectedRoom ? {
        lat: selectedRoom.location?.coordinates[1] || 28.6139,
        lng: selectedRoom.location?.coordinates[0] || 77.2090
    } : rooms && rooms.length > 0 ? {
        lat: rooms[0].location?.coordinates[1],
        lng: rooms[0].location?.coordinates[0]
    } : { lat: 28.6139, lng: 77.2090 };

    // Format markers for FreeMapView with proper data
    const markers = (rooms || []).map(room => ({
        latitude: room.location?.coordinates[1],
        longitude: room.location?.coordinates[0],
        price: room.rent?.amount || 0,
        title: room.title || 'Room',
        subtitle: `${room.location?.address?.city || ''} • ${room.roomType || 'Room'}`,
        roomId: room._id
    }));

    // Handle marker click - navigate to room details
    const handleMarkerClick = (index) => {
        setSelectedMarkerIndex(index);
        const room = rooms[index];

        if (room && navigation && room._id) {
            // Small delay for visual feedback
            setTimeout(() => {
                navigation.navigate('RoomDetails', { roomId: room._id });
            }, 300);
        }
    };

    // Auto-fit bounds when there are multiple rooms
    const shouldFitBounds = rooms && rooms.length > 1 && !selectedRoom;

    return (
        <View style={[styles.container, { height }]}>
            <FreeMapView
                latitude={center.lat}
                longitude={center.lng}
                zoom={selectedRoom ? 15 : 12}
                height={height}
                markers={markers}
                onMarkerClick={handleMarkerClick}
                selectedMarkerId={selectedMarkerIndex}
                fitBounds={shouldFitBounds}
            />

            {/* Stats Overlay */}
            {rooms && rooms.length > 0 && (
                <View style={styles.statsOverlay}>
                    <View style={styles.statsDot} />
                    <Text style={styles.statsText}>
                        {rooms.length} ROOMS FOUND
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        overflow: 'hidden',
    },
    priceMarker: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    priceMarkerNormal: {
        backgroundColor: '#10B981',
    },
    priceMarkerSelected: {
        backgroundColor: '#3B82F6',
        zIndex: 999,
        transform: [{ scale: 1.15 }],
    },
    priceMarkerText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    calloutContainer: {
        width: 200,
        backgroundColor: 'transparent',
    },
    calloutContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    calloutImage: {
        width: '100%',
        height: 100,
    },
    calloutTextContainer: {
        padding: 12,
    },
    calloutTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1F2937',
        marginBottom: 2,
    },
    calloutSubtitle: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    calloutPrice: {
        fontSize: 12,
        fontWeight: '900',
        color: '#10B981',
    },
    calloutArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FFF',
        alignSelf: 'center',
    },
    legendContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 10,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    statsOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
    },
    statsDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    statsText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 0.5,
    },
});

export default GlobalMapView;
