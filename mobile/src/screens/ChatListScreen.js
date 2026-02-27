import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { MessageSquare, ChevronRight } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { getSocket } from '../services/socket';

const ChatListScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConversations = useCallback(async () => {
        try {
            const { data } = await api.get('/chat/conversations');
            if (data?.success) {
                setConversations(data.data.conversations || []);
            }
        } catch (error) {
            console.error('Fetch conversations error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();

        // Listen for new messages to update the list
        const setupSocket = async () => {
            const socket = await getSocket();
            if (socket) {
                socket.on('receive_message', (msg) => {
                    fetchConversations();
                });
                return () => socket.off('receive_message');
            }
        };
        setupSocket();
    }, [fetchConversations]);

    // Polling fallback - refresh list every 2 seconds
    useFocusEffect(
        useCallback(() => {
            const interval = setInterval(() => {
                const silentFetch = async () => {
                    try {
                        const { data } = await api.get('/chat/conversations');
                        if (data?.success) {
                            setConversations(data.data.conversations || []);
                        }
                    } catch (e) { /* silent error */ }
                };
                silentFetch();
            }, 2000);

            return () => clearInterval(interval);
        }, [])
    );


    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const renderConversation = ({ item }) => {
        const otherUser = item.otherUser;
        const lastMsg = item.lastMessage;

        return (
            <TouchableOpacity
                style={styles.chatCard}
                onPress={() => navigation.navigate('ChatDetail', {
                    conversationId: item._id,
                    otherUser: otherUser,
                    roomId: item.room?._id
                })}
            >
                <Image
                    source={{ uri: otherUser?.avatar?.url || `https://ui-avatars.com/api/?name=${otherUser?.name}` }}
                    style={styles.avatar}
                />
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.userName} numberOfLines={1}>{otherUser?.name}</Text>
                        {item.updatedAt && (
                            <Text style={styles.timeText}>{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        )}
                    </View>
                    <View style={styles.msgRow}>
                        <Text style={styles.lastMsg} numberOfLines={1}>
                            {lastMsg?.content || 'No messages yet'}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    {item.room && (
                        <Text style={styles.roomTag}>Ref: {item.room.title}</Text>
                    )}
                </View>
                <ChevronRight size={20} color="#E5E7EB" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <MessageSquare size={40} color="#9CA3AF" />
                            </View>
                            <Text style={styles.emptyText}>No messages yet</Text>
                            <Text style={styles.emptySubText}>Contact owners or students to start chatting</Text>
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
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F3F4F6',
    },
    chatInfo: {
        flex: 1,
        marginLeft: 16,
        marginRight: 8,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    msgRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMsg: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    badge: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    roomTag: {
        fontSize: 10,
        color: '#2563EB',
        backgroundColor: '#EFF6FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 40,
    }
});

export default ChatListScreen;
