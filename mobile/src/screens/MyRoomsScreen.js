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
import { Plus, Edit2, Trash2, Eye, MapPin } from 'lucide-react-native';
import api from '../services/api';

const MyRoomsScreen = ({ navigation }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    const fetchRooms = useCallback(async () => {
        try {
            const { data } = await api.get('/rooms/my-rooms');
            if (data?.success) {
                setRooms(data.data.rooms || []);
            }
        } catch (error) {
            console.error('Fetch rooms error:', error);
            Alert.alert('Error', 'Failed to load your rooms');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    const handleDeleteRoom = (roomId) => {
        Alert.alert(
            'Delete Room',
            'Are you sure you want to delete this listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { data } = await api.delete(`/rooms/${roomId}`);
                            if (data?.success) {
                                Alert.alert('Success', 'Room deleted successfully');
                                fetchRooms();
                            }
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete room');
                        }
                    }
                }
            ]
        );
    };

    const filteredRooms = rooms.filter(room => {
        if (filter === 'all') return true;
        return room.verification?.status === filter;
    });

    const getVerificationColor = (status) => {
        switch (status) {
            case 'approved': return { bg: '#DCFCE7', text: '#166534' };
            case 'rejected': return { bg: '#FEE2E2', text: '#991B1B' };
            default: return { bg: '#FEF9C3', text: '#854D0E' };
        }
    };

    const renderRoomItem = ({ item }) => {
        const verificationColors = getVerificationColor(item.verification?.status);

        return (
            <View style={styles.roomCard}>
                <Image
                    source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/300' }}
                    style={styles.roomImage}
                />
                <View style={styles.roomContent}>
                    <View style={styles.headerRow}>
                        <Text style={styles.roomTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={[styles.statusTag, { backgroundColor: verificationColors.bg }]}>
                            <Text style={[styles.statusText, { color: verificationColors.text }]}>
                                {item.verification?.status || 'Pending'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={styles.locationText} numberOfLines={1}>{item.location?.address?.city || 'Location'}</Text>
                    </View>

                    <Text style={styles.rentText}>₹{item.rent?.amount}/mo</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Eye size={14} color="#6B7280" />
                            <Text style={styles.statText}>{item.stats?.views || 0} views</Text>
                        </View>
                        <View style={[styles.stat, { marginLeft: 'auto' }]}>
                            <View style={[styles.dot, { backgroundColor: item.availability?.status === 'available' ? '#22c55e' : '#ef4444' }]} />
                            <Text style={styles.statText}>{item.availability?.status || 'Available'}</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('RoomDetails', { roomId: item._id })}
                        >
                            <Eye size={20} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('EditRoom', { room: item })}
                        >
                            <Edit2 size={20} color="#059669" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeleteRoom(item._id)}
                        >
                            <Trash2 size={20} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Listings</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreateRoom')}
                >
                    <Plus size={20} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add New</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['all', 'approved', 'pending', 'rejected']}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                filter === item && styles.activeTab
                            ]}
                            onPress={() => setFilter(item)}
                        >
                            <Text style={[
                                styles.tabText,
                                filter === item && styles.activeTabText
                            ]}>
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.tabsContent}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={filteredRooms}
                    renderItem={renderRoomItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {filter === 'all'
                                    ? "You haven't listed any rooms yet."
                                    : `No ${filter} listings found.`}
                            </Text>
                            {filter === 'all' && (
                                <TouchableOpacity
                                    style={styles.createNowButton}
                                    onPress={() => navigation.navigate('CreateRoom')}
                                >
                                    <Text style={styles.createNowText}>List your first room</Text>
                                </TouchableOpacity>
                            )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    addButton: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    roomCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
    },
    roomImage: {
        width: 120,
        height: 160,
    },
    roomContent: {
        flex: 1,
        padding: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
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
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    statText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    actionButton: {
        marginLeft: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
        marginBottom: 20,
    },
    createNowButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    createNowText: {
        color: '#2563EB',
        fontWeight: 'bold',
    },
    tabsContainer: {
        marginBottom: 10,
    },
    tabsContent: {
        paddingHorizontal: 20,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeTab: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
});

export default MyRoomsScreen;
