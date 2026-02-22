import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { MapPin, Info, Navigation } from 'lucide-react-native';
import FreeMapView from '../common/FreeMapView';

const RoomMapView = ({ room, height = 300, showControls = true, isAdmin = false }) => {
    const [coordinates, setCoordinates] = useState(null);
    const [isExact, setIsExact] = useState(false);

    useEffect(() => {
        if (!room?.location) return;

        const locationVisibility = room.location?.locationVisibility || 'approximate';
        const hasExactLocation = room.location?.exactLocation?.coordinates?.length === 2;

        if ((locationVisibility === 'exact' || isAdmin) && hasExactLocation) {
            const [lng, lat] = room.location.exactLocation.coordinates;
            setCoordinates({ latitude: lat, longitude: lng });
            setIsExact(true);
        } else if (room.location?.coordinates?.length === 2) {
            const [lng, lat] = room.location.coordinates;
            setCoordinates({ latitude: lat, longitude: lng });
            setIsExact(false);
        }
    }, [room, isAdmin]);

    if (!coordinates) {
        return (
            <View style={[styles.emptyContainer, { height }]}>
                <Text style={styles.emptyText}>Location Preview Unavailable</Text>
            </View>
        );
    }

    const openInMaps = () => {
        const { latitude, longitude } = coordinates;
        const label = room.title;
        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
            android: `geo:0,0?q=${latitude},${longitude}(${label})`
        });
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            {/* Visibility Indicator */}
            <View style={[
                styles.indicator,
                isExact ? styles.indicatorExact : styles.indicatorApprox
            ]}>
                {isExact ? <MapPin size={18} color="#EF4444" /> : <Info size={18} color="#2563EB" />}
                <View style={styles.indicatorContent}>
                    <Text style={styles.indicatorLabel}>Location Status</Text>
                    <Text style={styles.indicatorValue}>
                        {isExact ? 'Exact door-step location shared' : 'Approximate neighborhood location'}
                    </Text>
                </View>
                {!isExact && (
                    <View style={styles.privacyBadge}>
                        <Text style={styles.privacyText}>Privacy Protected</Text>
                    </View>
                )}
            </View>

            {/* Map Container */}
            <View style={[styles.mapWrapper, { height }]}>
                <FreeMapView
                    latitude={coordinates.latitude}
                    longitude={coordinates.longitude}
                    zoom={isExact ? 16 : 14}
                    height={height}
                    showCircle={!isExact}
                    circleRadius={400}
                    markers={[{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                        title: room.title
                    }]}
                />
            </View>

            {/* Safety Banner */}
            <View style={styles.safetyBanner}>
                <Info size={20} color="#2563EB" />
                <View style={styles.safetyContent}>
                    <Text style={styles.safetyTitle}>Safety First</Text>
                    <Text style={styles.safetyDesc}>
                        We display the approximate location until your visit is approved. The exact door number will be shared via direct message.
                    </Text>
                </View>
            </View>

            {/* Address Card */}
            {room.location?.address && (
                <View style={styles.addressCard}>
                    <Text style={styles.addressLabel}>Verified Address</Text>
                    <Text style={styles.addressText}>
                        {[
                            room.location.address.street,
                            room.location.address.city,
                            room.location.address.state
                        ].filter(Boolean).join(', ')}
                        {room.location.address.zipCode ? ` - ${room.location.address.zipCode}` : ''}
                    </Text>
                    {room.location.landmark && (
                        <View style={styles.landmarkRow}>
                            <MapPin size={14} color="#2563EB" />
                            <Text style={styles.landmarkText}>Near {room.location.landmark}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Actions */}
            <TouchableOpacity style={styles.openBtn} onPress={openInMaps}>
                <Navigation size={18} color="#FFF" />
                <Text style={styles.openBtnText}>Open in Google Maps</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    indicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    indicatorExact: {
        backgroundColor: '#ECFDF5',
        borderColor: '#D1FAE5',
    },
    indicatorApprox: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    indicatorContent: {
        flex: 1,
        marginLeft: 12,
    },
    indicatorLabel: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#6B7280',
        marginBottom: 2,
    },
    indicatorValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    privacyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    privacyText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
    },
    mapWrapper: {
        overflow: 'hidden',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        position: 'relative',
        marginBottom: 16,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    toggleContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    toggleStrip: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: '#2563EB',
    },
    toggleText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#FFF',
    },
    safetyBanner: {
        backgroundColor: '#EFF6FF',
        padding: 20,
        borderRadius: 24,
        flexDirection: 'row',
        marginBottom: 16,
    },
    safetyContent: {
        flex: 1,
        marginLeft: 12,
    },
    safetyTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1E3A8A',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    safetyDesc: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E40AF',
        lineHeight: 18,
    },
    addressCard: {
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 16,
    },
    addressLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    addressText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 24,
    },
    landmarkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB',
    },
    landmarkText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2563EB',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    openBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    openBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#F3F4F6',
    },
    emptyText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
});

export default RoomMapView;
