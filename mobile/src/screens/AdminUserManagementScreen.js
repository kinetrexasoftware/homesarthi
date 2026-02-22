import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Users,
    Mail,
    Calendar,
    ShieldCheck,
    ArrowLeft,
    CheckCircle,
    Ban,
    Trash2,
    Search,
    ChevronDown,
    Filter
} from 'lucide-react-native';
import api from '../services/api';
import Loader from '../components/common/Loader';

const AdminUserManagementScreen = ({ navigation, route }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [reason, setReason] = useState('');

    // Initialize filters from route params
    const [filter, setFilter] = useState(route.params?.filter || 'owner'); // 'owner', 'student', 'all'
    const [statusFilter, setStatusFilter] = useState(route.params?.status || 'all'); // 'all', 'unverified'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/admin/users?role=${filter}&status=${statusFilter}&search=${searchQuery}`);
            if (data.success) {
                setUsers(data.data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [filter, statusFilter, searchQuery]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Force refresh when route params change (e.g. from Dashboard)
    useEffect(() => {
        if (route.params?.filter) setFilter(route.params.filter);
        if (route.params?.status) setStatusFilter(route.params.status);
    }, [route.params]);

    const handleAction = async (action) => {
        if (!reason.trim() && action !== 'approve') {
            Alert.alert('Error', 'Please provide a reason for this action.');
            return;
        }

        try {
            const { data } = await api.put(`/admin/users/${selectedUser._id}/${action}`, { reason });
            if (data.success) {
                Alert.alert('Success', `User ${action}ed successfully`);
                setSelectedUser(null);
                setReason('');
                fetchUsers();
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Action failed');
        }
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => setSelectedUser(item)}
        >
            <Image
                source={{ uri: item.avatar?.url || `https://ui-avatars.com/api/?name=${item.name}` }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {item.customId && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2563EB', backgroundColor: '#DBEAFE', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                            #{item.customId}
                        </Text>
                    )}
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
                <View style={styles.badgeContainer}>
                    <Text style={[styles.roleBadge, { backgroundColor: item.role === 'owner' ? '#DBEAFE' : '#F3F4F6', color: item.role === 'owner' ? '#1E40AF' : '#6B7280' }]}>
                        {item.role}
                    </Text>
                    <Text style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: item.status === 'active' ? '#065F46' : '#991B1B' }]}>
                        {item.status}
                    </Text>
                    {!item.verified && item.role === 'owner' && (
                        <Text style={[styles.statusBadge, { backgroundColor: '#FEF3C7', color: '#B45309' }]}>
                            Pending
                        </Text>
                    )}
                </View>
            </View>
            {item.verified && <ShieldCheck size={20} color="#2563EB" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Governance</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                    {['owner', 'student', 'all'].map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={[styles.filterBtn, filter === role && styles.filterBtnActive]}
                            onPress={() => setFilter(role)}
                        >
                            <Text style={[styles.filterText, filter === role && styles.filterTextActive]}>
                                {role.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {filter === 'owner' && (
                    <View style={styles.subFilterData}>
                        <TouchableOpacity
                            style={[styles.subFilterBtn, statusFilter === 'unverified' && styles.subFilterBtnActive]}
                            onPress={() => setStatusFilter('unverified')}
                        >
                            <Text style={[styles.subFilterText, statusFilter === 'unverified' && styles.subFilterBtnActiveText]}>Unverified</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.subFilterBtn, statusFilter === 'all' && styles.subFilterBtnActive]}
                            onPress={() => setStatusFilter('all')}
                        >
                            <Text style={[styles.subFilterText, statusFilter === 'all' && styles.subFilterBtnActiveText]}>All Owners</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, email or UID..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            <View style={styles.summaryBar}>
                <Text style={styles.summaryText}>{users.length} {statusFilter === 'unverified' ? 'Pending Verifications' : 'Identities Found'}</Text>
                <View style={styles.summaryLine} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Users size={48} color="#E5E7EB" />
                            <Text style={styles.emptyText}>No users matched your criteria</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={!!selectedUser}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedUser(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage User</Text>
                            <TouchableOpacity onPress={() => setSelectedUser(null)}>
                                <Text style={styles.closeBtn}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedUser && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.userDetailHeader}>
                                    <Image
                                        source={{ uri: selectedUser.avatar?.url || `https://ui-avatars.com/api/?name=${selectedUser.name}` }}
                                        style={styles.largeAvatar}
                                    />
                                    <Text style={styles.detailName}>{selectedUser.name}</Text>
                                    <Text style={styles.detailEmail}>{selectedUser.email}</Text>
                                </View>

                                <View style={styles.docsSection}>
                                    <Text style={styles.label}>Identity Documents</Text>
                                    {selectedUser.verificationDocuments?.length > 0 ? (
                                        <View style={styles.docsGrid}>
                                            {selectedUser.verificationDocuments.map((doc, idx) => (
                                                <TouchableOpacity key={idx} style={styles.docCard}>
                                                    <Image source={{ uri: doc.url }} style={styles.docImage} />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={styles.emptyDocs}>
                                            <ShieldCheck size={24} color="#9CA3AF" />
                                            <Text style={styles.emptyDocsText}>No Documents Uploaded</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.actionSection}>
                                    <Text style={styles.label}>Action Reason</Text>
                                    <TextInput
                                        style={styles.reasonInput}
                                        placeholder="Reason for verification/suspension..."
                                        multiline
                                        value={reason}
                                        onChangeText={setReason}
                                    />

                                    <View style={styles.btnGrid}>
                                        {selectedUser.role === 'owner' && !selectedUser.verified && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.approveBtn]}
                                                onPress={() => handleAction('approve')}
                                            >
                                                <CheckCircle size={18} color="#FFFFFF" />
                                                <Text style={styles.btnText}>Verify Owner</Text>
                                            </TouchableOpacity>
                                        )}
                                        {selectedUser.status === 'active' ? (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.suspendBtn]}
                                                onPress={() => handleAction('suspend')}
                                            >
                                                <Ban size={18} color="#EF4444" />
                                                <Text style={[styles.btnText, { color: '#EF4444' }]}>Suspend</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.approveBtn]}
                                                onPress={() => handleAction('activate')}
                                            >
                                                <CheckCircle size={18} color="#FFFFFF" />
                                                <Text style={styles.btnText}>Activate</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.deleteBtn]}
                                            onPress={() => {
                                                Alert.alert(
                                                    'Delete Account',
                                                    'Are you sure you want to permanently delete this user? This action cannot be undone.',
                                                    [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Delete', onPress: () => handleAction('delete'), style: 'destructive' }
                                                    ]
                                                );
                                            }}
                                        >
                                            <Trash2 size={18} color="#FFFFFF" />
                                            <Text style={styles.btnText}>Delete Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    filterSection: {
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    subFilterData: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 8,
        marginTop: 12,
    },
    subFilterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    subFilterBtnActive: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
    },
    subFilterText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    subFilterBtnActiveText: {
        color: '#B45309',
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    filterBtnActive: {
        backgroundColor: '#2563EB',
    },
    filterText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    userEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    roleBadge: {
        fontSize: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    statusBadge: {
        fontSize: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        height: '80%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeBtn: {
        color: '#2563EB',
        fontWeight: 'bold',
    },
    userDetailHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    largeAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
    },
    detailName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    detailEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    docsSection: {
        marginBottom: 24,
    },
    docsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
    },
    docCard: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    docImage: {
        width: '100%',
        height: '100%',
    },
    emptyDocs: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
        marginTop: 8,
    },
    emptyDocsText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginTop: 8,
        textTransform: 'uppercase',
    },
    actionSection: {
        marginTop: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    reasonInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    btnGrid: {
        gap: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    approveBtn: {
        backgroundColor: '#2563EB',
    },
    deleteBtn: {
        backgroundColor: '#111827',
    },
    suspendBtn: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    btnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 12,
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    filterMenuBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    summaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
});

export default AdminUserManagementScreen;
