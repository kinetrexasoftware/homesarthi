import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView,
    Alert,
    Platform
} from 'react-native';
import {
    MessageSquare, Plus, ChevronRight, Clock,
    Home, AlertCircle, X, Check,
    Headphones
} from 'lucide-react-native';
import supportApi from '../services/supportApi';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const SupportScreen = ({ navigation }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({
        category: 'listing_issue',
        subject: '',
        description: '',
        roomId: '',
        priority: 'medium'
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await supportApi.getMyTickets();
            setTickets(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/rooms/my-rooms');
            setRooms(data.data.rooms || []);
        } catch (error) { }
    };

    useEffect(() => {
        fetchTickets();
        fetchRooms();
    }, [fetchTickets]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const handleCreateTicket = async () => {
        if (!formData.subject || !formData.description) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }

        try {
            setSubmitting(true);
            await supportApi.createTicket(formData);
            Alert.alert('Success', 'Your support ticket has been created.');
            setShowCreateModal(false);
            setFormData({ category: 'listing_issue', subject: '', description: '', roomId: '', priority: 'medium' });
            fetchTickets();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const renderTicket = ({ item }) => {
        const config = supportApi.getStatusConfig(item.status);

        return (
            <TouchableOpacity
                style={styles.ticketCard}
                onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id, ticketTitle: item.ticketId })}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <Text style={styles.ticketIdText}>#{item.ticketId}</Text>
                </View>

                <Text style={styles.subjectText} numberOfLines={1}>{item.subject}</Text>
                <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cardFooter}>
                    <View style={styles.footerInfo}>
                        <Clock size={12} color="#9CA3AF" />
                        <Text style={styles.timeText}>{formatDistanceToNow(new Date(item.createdAt))} ago</Text>
                    </View>
                    <ChevronRight size={18} color="#D1D5DB" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 40 : 0 }]}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Support Center</Text>
                    <Text style={styles.headerSub}>How can we help you today?</Text>
                </View>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Plus size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#2563EB" size="large" />
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    renderItem={renderTicket}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Headphones size={60} color="#E5E7EB" />
                            <Text style={styles.emptyTitle}>No support tickets</Text>
                            <Text style={styles.emptySub}>If you're facing any issues, our team is here to help.</Text>
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => setShowCreateModal(true)}
                            >
                                <Text style={styles.emptyBtnText}>Create Ticket</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Create Ticket Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Support Ticket</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.pickerContainer}>
                                {['listing_issue', 'payment', 'verification', 'technical', 'other'].map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryItem,
                                            formData.category === cat && styles.categoryActive
                                        ]}
                                        onPress={() => setFormData({ ...formData, category: cat })}
                                    >
                                        <Text style={[
                                            styles.categoryLabel,
                                            formData.category === cat && styles.categoryLabelActive
                                        ]}>
                                            {cat.replace('_', ' ')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Subject</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What's the issue?"
                                value={formData.subject}
                                onChangeText={text => setFormData({ ...formData, subject: text })}
                            />

                            <Text style={styles.label}>Detailed Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the problem in detail..."
                                multiline
                                numberOfLines={4}
                                value={formData.description}
                                onChangeText={text => setFormData({ ...formData, description: text })}
                                textAlignVertical="top"
                            />

                            <Text style={styles.label}>Link Property (Optional)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyList}>
                                <TouchableOpacity
                                    style={[styles.propertyItem, formData.roomId === '' && styles.propertyActive]}
                                    onPress={() => setFormData({ ...formData, roomId: '' })}
                                >
                                    <Text style={[styles.propertyLabel, formData.roomId === '' && styles.propertyLabelActive]}>None</Text>
                                </TouchableOpacity>
                                {rooms.map(room => (
                                    <TouchableOpacity
                                        key={room._id}
                                        style={[styles.propertyItem, formData.roomId === room._id && styles.propertyActive]}
                                        onPress={() => setFormData({ ...formData, roomId: room._id })}
                                    >
                                        <Text style={[styles.propertyLabel, formData.roomId === room._id && styles.propertyLabelActive]}>{room.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                                onPress={handleCreateTicket}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Ticket</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 20 : 50,
        paddingBottom: 24,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827'
    },
    headerSub: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 2
    },
    createBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }
    },
    list: {
        padding: 20,
        paddingTop: 30,
        paddingBottom: 40
    },
    ticketCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    ticketIdText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700'
    },
    subjectText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4
    },
    descText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB'
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    timeText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginTop: 16
    },
    emptySub: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40
    },
    emptyBtn: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#2563EB',
        borderRadius: 12
    },
    emptyBtnText: {
        color: '#2563EB',
        fontWeight: '700',
        fontSize: 14
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        minHeight: '80%',
        maxHeight: '90%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827'
    },
    modalForm: {
        padding: 24
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 14,
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 20
    },
    textArea: {
        height: 120
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20
    },
    categoryItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    categoryActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB'
    },
    categoryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'capitalize'
    },
    categoryLabelActive: {
        color: '#2563EB'
    },
    propertyList: {
        marginBottom: 24,
        marginHorizontal: -4
    },
    propertyItem: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    propertyActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB'
    },
    propertyLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280'
    },
    propertyLabelActive: {
        color: '#FFF'
    },
    submitBtn: {
        backgroundColor: '#2563EB',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 }
    },
    btnDisabled: {
        opacity: 0.6
    },
    submitText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 1
    }
});

export default SupportScreen;
