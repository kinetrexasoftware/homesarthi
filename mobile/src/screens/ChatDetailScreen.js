import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ChevronLeft, Home, Info, Ban, Unlock } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Alert } from 'react-native';

const ChatDetailScreen = ({ route, navigation }) => {
    // Handle both cases: otherUser object OR userId string
    const { conversationId, otherUser: otherUserProp, roomId, userId } = route.params;
    const user = useAuthStore((state) => state?.user);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [roomInfo, setRoomInfo] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [amIBlocked, setAmIBlocked] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const [otherUser, setOtherUser] = useState(otherUserProp || null);

    const flatListRef = useRef();
    const socketRef = useRef();

    // If userId is provided (from notification), fetch user data
    useEffect(() => {
        if (userId && !otherUser) {
            const fetchUserData = async () => {
                setFetching(true);
                try {
                    const { data } = await api.get(`/users/${userId}`);
                    if (data?.success) {
                        setOtherUser(data.data.user);
                    }
                } catch (error) {
                    console.error('Error fetching user:', error);
                    // Fallback: create minimal user object
                    setOtherUser({ _id: userId, name: 'User', avatar: null });
                } finally {
                    setFetching(false);
                }
            };
            fetchUserData();
        }
    }, [userId]);

    const fetchMessages = useCallback(async () => {
        if (!otherUser?._id) return;
        try {
            const { data } = await api.get(`/chat/conversation/${otherUser._id}`);
            if (data?.success) {
                // Reverse for inverted list
                setMessages(data.data.messages.reverse());
                setIsBlocked(data.data.isBlocked);
                setAmIBlocked(data.data.amIBlocked);
            }
        } catch (error) {
            console.error('Fetch messages error:', error);
        } finally {
            setFetching(false);
        }
    }, [otherUser?._id]);

    const fetchRoomDetails = useCallback(async () => {
        if (!roomId) return;
        try {
            const { data } = await api.get(`/rooms/${roomId}`);
            if (data?.success) {
                setRoomInfo(data.data.room);
            }
        } catch (error) {
            console.error('Fetch room error:', error);
        }
    }, [roomId]);

    useEffect(() => {
        // Only fetch messages when otherUser is available
        if (!otherUser) return;

        fetchMessages();
        fetchRoomDetails();

        const setupSocket = async () => {
            const socket = await getSocket();
            socketRef.current = socket;
            if (socket && otherUser?._id) {
                socket.on('receive_message', (msg) => {
                    if (msg.sender?._id === otherUser._id || msg.sender === otherUser._id) {
                        setMessages(prev => [msg, ...prev]);
                    }
                });
                socket.on('message_sent', (msg) => {
                    setMessages(prev => [msg, ...prev]);
                });
            }
        };

        setupSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.off('receive_message');
                socketRef.current.off('message_sent');
            }
        };
    }, [otherUser, fetchMessages, fetchRoomDetails]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || loading || !otherUser?._id) return;

        const content = newMessage.trim();
        setNewMessage('');
        setLoading(true);

        try {
            const { data } = await api.post('/chat/send', {
                recipientId: otherUser._id,
                roomId: roomId || null,
                content: content
            });

            if (data.success) {
                // Note: Socket listener 'message_sent' will also add this, 
                // but adding local feedback is faster if backend doesn't emit to sender
                // setMessages(prev => [data.data.message, ...prev]);
            }
        } catch (error) {
            console.error('Send error:', error);
            setNewMessage(content);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async () => {
        Alert.alert(
            "Block User",
            "Are you sure you want to block this user? They will not be able to message you.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block",
                    style: "destructive",
                    onPress: async () => {
                        setBlocking(true);
                        try {
                            const { data } = await api.post('/chat/block', { userId: otherUser._id });
                            if (data.success) {
                                setIsBlocked(true);
                            }
                        } catch (error) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to block user");
                        } finally {
                            setBlocking(false);
                        }
                    }
                }
            ]
        );
    };

    const handleUnblockUser = async () => {
        setBlocking(true);
        try {
            const { data } = await api.post('/chat/unblock', { userId: otherUser._id });
            if (data.success) {
                setIsBlocked(false);
            }
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Failed to unblock user");
        } finally {
            setBlocking(false);
        }
    };

    const renderMessage = ({ item }) => {
        if (!user || !item) return null;

        // Robust ID handling - support both _id (mongoose) and id (login response)
        const currentUserId = (user._id || user.id || '').toString();
        const senderId = item.sender?._id
            ? item.sender._id.toString()
            : (item.sender ? item.sender.toString() : '');

        const isOwn = currentUserId === senderId;
        const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isRead = item.readBy && item.readBy.some(r => r.user);

        return (
            <View style={[styles.messageRow, isOwn ? styles.ownRow : styles.otherRow]}>
                <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
                        {item.content}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[styles.timeText, isOwn ? styles.ownTime : styles.otherTime]}>
                            {time}
                        </Text>
                        {isOwn && (
                            <View style={styles.checkMarks}>
                                <Text style={[styles.checkMark, isRead && styles.readCheckMark]}>
                                    {isRead ? '✓✓' : '✓'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    {otherUser && (
                        <>
                            <Image
                                source={{ uri: otherUser.avatar?.url || `https://ui-avatars.com/api/?name=${otherUser.name || 'User'}` }}
                                style={styles.headerAvatar}
                            />
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{otherUser.name || 'User'}</Text>
                                <Text style={styles.headerSubtitle}>Online</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.infoBtn}
                                onPress={isBlocked ? handleUnblockUser : handleBlockUser}
                                disabled={blocking}
                            >
                                {blocking ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : isBlocked ? (
                                    <Unlock size={20} color="#EF4444" />
                                ) : (
                                    <Ban size={20} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {amIBlocked && (
                    <View style={styles.blockedBanner}>
                        <Text style={styles.blockedBannerText}>You cannot reply to this conversation.</Text>
                    </View>
                )}

                {isBlocked && (
                    <View style={[styles.blockedBanner, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.blockedBannerText, { color: '#B91C1C' }]}>You have blocked this user.</Text>
                    </View>
                )}

                {roomInfo && (
                    <TouchableOpacity
                        style={styles.roomRef}
                        onPress={() => navigation.navigate('RoomDetails', { roomId: roomInfo._id })}
                    >
                        <Home size={16} color="#2563EB" />
                        <Text style={styles.roomRefText} numberOfLines={1}>{roomInfo.title}</Text>
                        <Text style={styles.roomRefPrice}>₹{roomInfo.rent?.amount}</Text>
                    </TouchableOpacity>
                )}

                {/* MESSAGES */}
                {fetching ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="small" color="#2563EB" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item._id || Math.random().toString()}
                        inverted
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                    />
                )}

                {/* INPUT AREA */}
                {!isBlocked && !amIBlocked ? (
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline
                                placeholderTextColor="#9CA3AF"
                                blurOnSubmit={false}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
                                onPress={handleSendMessage}
                                disabled={!newMessage.trim() || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Send size={20} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.blockedInputFallback}>
                        <Text style={styles.blockedInputText}>
                            {isBlocked ? "Unblock to send messages" : "Messaging is unavailable"}
                        </Text>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5DDD5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#075E54', // WhatsApp Dark Green
        paddingTop: Platform.OS === 'android' ? 45 : 12,
        paddingBottom: 12,
    },
    backBtn: {
        marginRight: 8,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#D1FAE5', // Light Teal
        fontWeight: '500',
    },
    infoBtn: {
        padding: 4,
    },
    roomRef: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 12,
        margin: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    roomRefText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#1E40AF',
        marginLeft: 8,
    },
    roomRefPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    listContent: {
        padding: 16,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    ownRow: {
        justifyContent: 'flex-end',
    },
    otherRow: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    ownBubble: {
        backgroundColor: '#E7FFDB',
        borderTopRightRadius: 0,
        alignSelf: 'flex-end',
    },
    otherBubble: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 0,
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '400',
    },
    ownText: {
        color: '#111827',
    },
    otherText: {
        color: '#111827',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    timeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    ownTime: {
        color: '#6B7280',
    },
    otherTime: {
        color: '#9CA3AF',
    },
    checkMarks: {
        marginLeft: 2,
    },
    checkMark: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    readCheckMark: {
        color: '#34B7F1',
    },
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        backgroundColor: '#FFFFFF',
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
        maxHeight: 120,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#075E54', // WhatsApp Green
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    sendBtnDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockedBanner: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    blockedBannerText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    blockedInputFallback: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    blockedInputText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
    }
});

export default ChatDetailScreen;
