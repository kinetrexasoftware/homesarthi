import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { MapPin, Eye, Heart } from 'lucide-react-native';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const SavedRoomsScreen = ({ navigation }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const updateUser = useAuthStore((state) => state.updateUser);

    const fetchSavedRooms = useCallback(async () => {
        try {
            const { data } = await api.get('/users/profile');
            if (data?.success) {
                const user = data.data.user;
                setRooms(user.savedRooms || []);
                // Update local store as well
                updateUser(user);
            }
        } catch (error) {
            console.error('Fetch saved rooms error:', error);
            Alert.alert('Error', 'Failed to load saved rooms');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [updateUser]);

    useEffect(() => {
        fetchSavedRooms();
    }, [fetchSavedRooms]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSavedRooms();
    };

    const handleRoomPress = (roomId) => {
        navigation.navigate('RoomDetails', { roomId });
    };

    const renderRoomItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.roomCard}
                onPress={() => handleRoomPress(item._id)}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/300' }}
                    style={styles.roomImage}
                />
                <View style={styles.roomContent}>
                    <View style={styles.headerRow}>
                        <Text style={styles.roomTitle} numberOfLines={1}>{item.title}</Text>
                        <Heart size={20} color="#E11D48" fill="#E11D48" />
                    </View>

                    <View style={styles.infoRow}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.location?.address?.city || item.location?.city || 'Unknown Location'}
                        </Text>
                    </View>

                    <Text style={styles.rentText}>₹{item.rent?.amount}/mo</Text>

                    <View style={styles.footerRow}>
                        <View style={[styles.badge, styles.typeBadge]}>
                            <Text style={styles.typeText}>{item.roomType}</Text>
                        </View>
                        <View style={[
                            styles.badge,
                            { backgroundColor: item.availability?.status === 'available' ? '#DCFCE7' : '#FEE2E2' }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                { color: item.availability?.status === 'available' ? '#166534' : '#991B1B' }
                            ]}>
                                {item.availability?.status === 'available' ? 'Available' : 'Booked'}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Saved Rooms</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    renderItem={renderRoomItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Heart size={48} color="#E5E7EB" fill="#F3F4F6" />
                            <Text style={styles.emptyText}>No saved rooms yet</Text>
                            <TouchableOpacity
                                style={styles.exploreButton}
                                onPress={() => navigation.navigate('Explore')}
                            >
                                <Text style={styles.exploreButtonText}>Start Exploring</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    roomCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        height: 140, // Fixed height for list view
    },
    roomImage: {
        width: 120,
        height: '100%',
    },
    roomContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    rentText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
        marginTop: 6,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeBadge: {
        backgroundColor: '#EFF6FF',
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 24,
    },
    exploreButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    exploreButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default SavedRoomsScreen;
