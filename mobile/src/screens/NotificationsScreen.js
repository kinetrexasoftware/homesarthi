import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { Bell, MessageCircle, Home, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import {
    fetchNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '../services/notificationApi';

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, unread, messages, visits, roomUpdates
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);

            const options = {};
            if (filter === 'unread') {
                options.unreadOnly = true;
            } else if (filter !== 'all') {
                options.category = filter;
            }

            const result = await fetchNotifications(options);
            // Add safety check for result structure
            if (result?.data) {
                const rawNotifications = result.data.notifications || [];

                // Group chat notifications by sender
                const grouped = groupChatNotifications(rawNotifications);

                setNotifications(grouped);
                setUnreadCount(result.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Set empty array to avoid undefined errors
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    // Group chat notifications from same sender
    const groupChatNotifications = (notificationsList) => {
        const result = [];
        const chatGroups = {};

        notificationsList.forEach(notif => {
            if (notif.type === 'message' && notif.data?.senderId) {
                const senderId = notif.data.senderId;
                if (!chatGroups[senderId]) {
                    chatGroups[senderId] = {
                        ...notif,
                        isGrouped: true,
                        unreadCount: notif.read ? 0 : 1,
                        totalCount: 1
                    };
                    result.push(chatGroups[senderId]);
                } else {
                    chatGroups[senderId].totalCount++;
                    if (!notif.read) chatGroups[senderId].unreadCount++;

                    // Update header if newer
                    if (new Date(notif.createdAt) > new Date(chatGroups[senderId].createdAt)) {
                        chatGroups[senderId].body = notif.body;
                        chatGroups[senderId].createdAt = notif.createdAt;
                    }
                    if (!notif.read) chatGroups[senderId].read = false;
                }
            } else {
                result.push(notif);
            }
        });

        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications(false);
    };

    const handleNotificationPress = async (notification) => {
        try {
            // Safety check for notification object
            if (!notification || !notification._id) {
                console.error('Invalid notification object:', notification);
                return;
            }

            // Mark as read
            if (!notification.read) {
                await markNotificationAsRead(notification._id);

                // Locally mark this whole group as read for immediate feedback
                setNotifications(prev =>
                    prev.map(n => {
                        if (n?._id === notification._id) return { ...n, read: true, unreadCount: 0 };
                        // If it's a grouped message from same sender, mark and clear unread count
                        if (n.isGrouped && n.data?.senderId === notification.data?.senderId) {
                            return { ...n, read: true, unreadCount: 0 };
                        }
                        return n;
                    })
                );

                // Use API count for accurate global count
                const newCount = await getUnreadCount();
                setUnreadCount(newCount);
            }

            // Navigate based on actionUrl or type
            handleDeepLink(notification);
        } catch (error) {
            console.error('Error handling notification:', error);
        }
    };

    const handleDeepLink = (notification) => {
        const { actionUrl, type, data } = notification;

        // Parse deep link: roomsarthi://chat/123
        if (actionUrl) {
            const match = actionUrl.match(/roomsarthi:\/\/(\w+)\/(.+)/);
            if (match) {
                const [, screen, id] = match;

                switch (screen) {
                    case 'chat':
                        navigation.navigate('ChatDetail', { userId: id });
                        break;
                    case 'visit':
                        navigation.navigate('Visits');
                        break;
                    case 'room':
                        navigation.navigate('RoomDetails', { roomId: id });
                        break;
                    default:
                        console.log('Unknown deep link:', actionUrl);
                }
            }
        } else {
            // Fallback: Navigate based on type
            if (type === 'message') {
                navigation.navigate('ChatDetail', { userId: data?.senderId });
            } else if (type.includes('visit')) {
                navigation.navigate('Visits');
            } else if (type.includes('room')) {
                navigation.navigate('MyRooms');
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            Alert.alert('Success', 'All notifications marked as read');
        } catch (error) {
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            // Safety check
            if (!notificationId) return;

            await deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n?._id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type, category) => {
        if (type === 'message') return <MessageCircle size={20} color="#2563EB" />;
        if (type.includes('visit_approved')) return <CheckCircle size={20} color="#10B981" />;
        if (type.includes('visit_rejected')) return <XCircle size={20} color="#EF4444" />;
        if (type.includes('room_approved')) return <Home size={20} color="#10B981" />;
        if (type.includes('room_rejected')) return <Home size={20} color="#EF4444" />;
        if (category === 'admin') return <AlertTriangle size={20} color="#F59E0B" />;
        return <Bell size={20} color="#6B7280" />;
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'messages': return '#EFF6FF';
            case 'visits': return '#F0FDF4';
            case 'roomUpdates': return '#FEF3C7';
            case 'admin': return '#FEF2F2';
            default: return '#F9FAFB';
        }
    };

    const renderNotification = ({ item }) => {
        const bgColor = getCategoryColor(item.category);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    { backgroundColor: bgColor },
                    !item.read && styles.unreadCard
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        {getNotificationIcon(item.type, item.category)}
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={[styles.title, !item.read && styles.unreadText]}>
                            {item.title}
                        </Text>
                        <Text style={styles.body} numberOfLines={2}>
                            {item.body}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                            {item.isGrouped && item.totalCount > 1 && (
                                <Text style={styles.groupInfo}>• {item.totalCount} messages</Text>
                            )}
                        </View>
                    </View>

                    {!item.read && <View style={styles.unreadDot} />}
                    {item.isGrouped && item.unreadCount > 0 && (
                        <View style={styles.messageCountBadge}>
                            <Text style={styles.messageCountText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(item._id);
                    }}
                >
                    <Trash2 size={16} color="#6B7280" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const formatTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diff = now - notifDate;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return notifDate.toLocaleDateString();
    };

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'unread', label: 'Unread' },
        { key: 'messages', label: 'Messages' },
        { key: 'visits', label: 'Visits' },
        { key: 'roomUpdates', label: 'Rooms' }
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Text style={styles.markAllBtn}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={filters}
                    keyExtractor={(item) => item.key}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                filter === item.key && styles.filterChipActive
                            ]}
                            onPress={() => setFilter(item.key)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    filter === item.key && styles.filterTextActive
                                ]}
                            >
                                {item.label}
                                {item.key === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Notifications List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563EB']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Bell size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                            <Text style={styles.emptySubtext}>
                                We'll notify you about important updates
                            </Text>
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
        paddingTop: 60
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827'
    },
    markAllBtn: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB'
    },
    filterContainer: {
        paddingVertical: 12,
        paddingLeft: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    filterChipActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB'
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    filterTextActive: {
        color: '#FFFFFF'
    },
    listContent: {
        padding: 16
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563EB'
    },
    cardHeader: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'flex-start'
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    contentContainer: {
        flex: 1
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4
    },
    unreadText: {
        fontWeight: '800'
    },
    body: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 8,
        lineHeight: 20
    },
    time: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500'
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563EB',
        marginLeft: 8
    },
    deleteBtn: {
        padding: 8
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 16
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8
    },
    messageCount: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: 'normal'
    },
    messageCountBadge: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        paddingHorizontal: 6
    },
    messageCountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    groupInfo: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    }
});

export default NotificationsScreen;
