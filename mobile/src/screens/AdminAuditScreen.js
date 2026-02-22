import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image
} from 'react-native';
import {
    Search,
    ShieldAlert,
    CheckCircle,
    Activity,
    User,
    Home,
    FileText,
    Clock,
    ChevronLeft
} from 'lucide-react-native';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminAuditScreen = ({ navigation }) => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'user', 'room', 'report'

    const fetchLogs = useCallback(async () => {
        try {
            const response = await api.get('/admin/audit-logs');
            if (response.data.success) {
                setLogs(response.data.data || []);
            }
        } catch (error) {
            console.error('Audit fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const filtered = logs.filter(log => {
            const matchesSearch =
                log.action?.toLowerCase().includes(lowerSearch) ||
                log.targetName?.toLowerCase().includes(lowerSearch) ||
                log.admin?.name?.toLowerCase().includes(lowerSearch);

            const matchesFilter =
                filter === 'all' ? true :
                    filter === 'user' ? log.targetType === 'User' :
                        filter === 'room' ? log.targetType === 'Room' :
                            filter === 'report' ? log.targetType === 'Report' : true;

            return matchesSearch && matchesFilter;
        });
        setFilteredLogs(filtered);
    }, [search, filter, logs]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLogs();
    };

    const getActionIcon = (action) => {
        if (action.includes('REJECT') || action.includes('SUSPEND') || action.includes('BLOCK') || action.includes('DELETE'))
            return <ShieldAlert color="#EF4444" size={20} />;
        if (action.includes('APPROVE') || action.includes('ACTIVATE') || action.includes('RESOLVE') || action.includes('VERIFY'))
            return <CheckCircle color="#10B981" size={20} />;
        return <Activity color="#3B82F6" size={20} />;
    };

    const handleLogClick = (log) => {
        if (log.targetType === 'User') navigation.navigate('AdminUserManagement', { search: log.targetName }); // Adjust based on target screen
        // Add other navigations if needed, e.g., Room details
        if (log.targetType === 'Room') navigation.navigate('RoomDetails', { roomId: log.targetId });
        if (log.targetType === 'Report') navigation.navigate('AdminReports', { reportId: log.targetId });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.logCard} onPress={() => handleLogClick(item)}>
            <View style={styles.logHeader}>
                <View style={[styles.iconBox, {
                    backgroundColor: item.action.includes('REJECT') || item.action.includes('BLOCK') ? '#FEE2E2' :
                        item.action.includes('APPROVE') ? '#D1FAE5' : '#DBEAFE'
                }]}>
                    {getActionIcon(item.action)}
                </View>
                <View style={styles.logTitleContent}>
                    <Text style={styles.logAction}>{item.action.replace(/_/g, ' ')}</Text>
                    <View style={styles.metaRow}>
                        <Clock size={12} color="#9CA3AF" />
                        <Text style={styles.logTime}>
                            {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.targetSection}>
                <View style={styles.targetInfo}>
                    <View style={styles.targetIcon}>
                        {item.targetType === 'User' && <User size={14} color="#6B7280" />}
                        {item.targetType === 'Room' && <Home size={14} color="#6B7280" />}
                        {item.targetType === 'Report' && <FileText size={14} color="#6B7280" />}
                    </View>
                    <Text style={styles.targetName} numberOfLines={1}>{item.targetName || 'Unknown Entity'}</Text>
                </View>
                <Text style={styles.adminName}>By: {item.admin?.name || 'System'}</Text>
            </View>

            {item.reason && (
                <View style={styles.reasonBox}>
                    <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Audit Logs</Text>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search logs..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            <View style={styles.filterSection}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['all', 'user', 'room', 'report']}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, filter === item && styles.activeChip]}
                            onPress={() => setFilter(item)}
                        >
                            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>
                                {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={filteredLogs}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No logs found</Text>
                        </View>
                    }
                />
            )}
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
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#111827',
    },
    filterSection: {
        backgroundColor: '#FFFFFF',
        paddingBottom: 16,
    },
    filterList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    activeChip: {
        backgroundColor: '#2563EB',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logTitleContent: {
        flex: 1,
    },
    logAction: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'capitalize',
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    logTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    targetSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
    },
    targetInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    targetIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    targetName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    adminName: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    reasonBox: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    reasonText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
    }
});

export default AdminAuditScreen;
