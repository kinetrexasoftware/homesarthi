import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Alert,
    ScrollView
} from 'react-native';
import {
    Send, ChevronLeft, Clock, AlertCircle,
    Home, MessageSquare
} from 'lucide-react-native';
import supportApi from '../services/supportApi';
import { formatDistanceToNow } from 'date-fns';

const TicketDetailScreen = ({ route, navigation }) => {
    const { ticketId, ticketTitle } = route.params;
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const flatListRef = useRef(null);

    useEffect(() => {
        fetchTicketDetails();
    }, [ticketId]);

    const fetchTicketDetails = async () => {
        try {
            setLoading(true);
            const { data } = await supportApi.getTicketById(ticketId);
            setTicket(data.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load ticket details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim()) return;

        try {
            setSubmitting(true);
            const { data } = await supportApi.addReply(ticketId, { message: replyMessage });

            // Local update for optimistic UI
            const newReply = {
                ...data.data,
                user: { name: 'You' },
                createdAt: new Date().toISOString()
            };

            setTicket(prev => ({
                ...prev,
                responses: [...prev.responses, newReply]
            }));
            setReplyMessage('');

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            Alert.alert('Error', 'Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const renderResponse = ({ item }) => {
        const isAdmin = item.isAdmin;

        return (
            <View style={[
                styles.messageContainer,
                isAdmin ? styles.adminMessage : styles.userMessage
            ]}>
                <View style={[
                    styles.messageBubble,
                    isAdmin ? styles.adminBubble : styles.userBubble
                ]}>
                    <View style={styles.messageHeader}>
                        <Text style={[styles.userName, isAdmin && styles.adminName]}>
                            {isAdmin ? 'HomeSarthi Support' : 'You'}
                        </Text>
                        <Text style={[styles.messageTime, isAdmin && styles.adminTime]}>
                            {formatDistanceToNow(new Date(item.createdAt))} ago
                        </Text>
                    </View>
                    <Text style={[styles.messageText, isAdmin && styles.adminText]}>{item.message}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#2563EB" size="large" />
            </View>
        );
    }

    const config = supportApi.getStatusConfig(ticket.status);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Ticket #{ticket.ticketId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={ticket.responses}
                    renderItem={renderResponse}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.messageList}
                    ListHeaderComponent={
                        <View style={styles.ticketMain}>
                            <View style={styles.priorityBox}>
                                <Text style={styles.categoryText}>{ticket.category.replace('_', ' ')}</Text>
                                <View style={[styles.priorityBadge,
                                ticket.priority === 'high' ? styles.highP :
                                    ticket.priority === 'medium' ? styles.mediumP : styles.lowP
                                ]}>
                                    <Text style={[styles.priorityText,
                                    ticket.priority === 'high' ? styles.highT :
                                        ticket.priority === 'medium' ? styles.mediumT : styles.lowT
                                    ]}>{ticket.priority}</Text>
                                </View>
                            </View>
                            <Text style={styles.subjectText}>{ticket.subject}</Text>
                            <View style={styles.descriptionBox}>
                                <Text style={styles.descriptionText}>{ticket.description}</Text>
                            </View>

                            {ticket.room && (
                                <View style={styles.linkedRoom}>
                                    <Home size={14} color="#2563EB" />
                                    <Text style={styles.roomText}>Linked: {ticket.room.title}</Text>
                                </View>
                            )}

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerLabel}>Conversation History</Text>
                                <View style={styles.dividerLine} />
                            </View>
                        </View>
                    }
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />

                {ticket.status !== 'closed' && (
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type your reply..."
                                value={replyMessage}
                                onChangeText={setReplyMessage}
                                multiline
                                maxHeight={100}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !replyMessage.trim() && styles.sendBtnDisabled]}
                                onPress={handleSendReply}
                                disabled={submitting || !replyMessage.trim()}
                            >
                                {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={20} color="#FFF" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 20 : 50,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    backBtn: {
        padding: 4,
        marginRight: 12
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    content: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    ticketMain: {
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    priorityBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    priorityText: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase'
    },
    highP: { backgroundColor: '#FEF2F2' },
    highT: { color: '#EF4444' },
    mediumP: { backgroundColor: '#FFFBEB' },
    mediumT: { color: '#D97706' },
    lowP: { backgroundColor: '#ECFDF5' },
    lowT: { color: '#10B981' },
    subjectText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8
    },
    descriptionBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#2563EB'
    },
    descriptionText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        fontWeight: '600'
    },
    linkedRoom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16
    },
    roomText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2563EB'
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        gap: 10
    },
    dividerLine: {
        height: 1,
        flex: 1,
        backgroundColor: '#F3F4F6'
    },
    dividerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#D1D5DB',
        textTransform: 'uppercase'
    },
    messageList: {
        paddingBottom: 20
    },
    messageContainer: {
        paddingHorizontal: 16,
        marginVertical: 8,
        flexDirection: 'row'
    },
    userMessage: {
        justifyContent: 'flex-end'
    },
    adminMessage: {
        justifyContent: 'flex-start'
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 16,
        borderRadius: 20
    },
    userBubble: {
        backgroundColor: '#2563EB',
        borderTopRightRadius: 4
    },
    adminBubble: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        gap: 12
    },
    userName: {
        fontSize: 9,
        fontWeight: '800',
        color: '#DBEAFE',
        textTransform: 'uppercase'
    },
    adminName: {
        color: '#2563EB'
    },
    messageTime: {
        fontSize: 8,
        color: '#DBEAFE',
        fontWeight: '600',
        opacity: 0.8
    },
    adminTime: {
        color: '#9CA3AF'
    },
    messageText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
        lineHeight: 20
    },
    adminText: {
        color: '#374151'
    },
    inputWrapper: {
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingBottom: Platform.OS === 'ios' ? 24 : 16
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        maxHeight: 100
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendBtnDisabled: {
        backgroundColor: '#E5E7EB'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default TicketDetailScreen;
