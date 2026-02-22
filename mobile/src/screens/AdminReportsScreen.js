import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    Modal,
    TextInput,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    ShieldAlert,
    AlertTriangle,
    Gavel,
    Trash2,
    CheckCircle,
    XCircle,
    ChevronRight,
    Home,
    User as UserIcon,
    ShieldCheck,
    MessageSquare,
    Eye,
    Scale,
    Search
} from 'lucide-react-native';
import api from '../services/api';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const { width } = Dimensions.get('window');

const AdminReportsScreen = ({ navigation }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [actionNotes, setActionNotes] = useState('');
    const [filter, setFilter] = useState('pending');
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/reports?status=${filter}&search=${searchQuery}`);
            setReports(response.data.data.reports || []);
        } catch (error) {
            console.error('Fetch reports error:', error);
            Alert.alert('Error', 'Failed to fetch safety reports');
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const executeResolution = async (action) => {
        if (!selectedReport) return;
        if (!actionNotes.trim()) {
            Alert.alert('Error', 'Review notes are required for resolution');
            return;
        }

        try {
            setActionLoading(true);
            await api.put(`/admin/reports/${selectedReport._id}/resolve`, {
                action,
                notes: actionNotes
            });

            const actionMsg = action === 'block_listing' ? 'Room listing removed' :
                action === 'block_user' ? 'User account banned' : 'Report dismissed';

            Alert.alert('Success', actionMsg);
            setSelectedReport(null);
            setActionNotes('');
            fetchReports();
        } catch (error) {
            console.error('Resolve report error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Moderation action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const getSeverityColor = (reason) => {
        const critical = ['scam_fraud', 'privacy_violation', 'unsafe_area'];
        return critical.includes(reason) ? '#EF4444' : '#F59E0B';
    };

    const renderReportItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.reportCard, selectedReport?._id === item._id && styles.selectedCard]}
            onPress={() => setSelectedReport(item)}
        >
            <View style={styles.reportHeader}>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.reason) + '10' }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(item.reason) }]}>
                        {item.reason.replace(/_/g, ' ')}
                    </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={styles.targetInfo}>
                <View style={styles.targetIconBox}>
                    {item.reportType === 'room' ? <Home size={16} color="#4B5563" /> : <UserIcon size={16} color="#4B5563" />}
                </View>
                <View style={styles.targetTextContainer}>
                    <Text style={styles.targetTitle} numberOfLines={1}>
                        {item.target?.title || item.target?.name || `Target ID: ${item.targetId.slice(-6)}`}
                    </Text>
                    <Text style={styles.reporterText}>Report by {item.reportedBy?.name}</Text>
                </View>
                <ChevronRight size={20} color="#D1D5DB" />
            </View>

            <Text style={styles.descriptionSnippet} numberOfLines={2}>
                "{item.description}"
            </Text>
        </TouchableOpacity>
    );

    if (loading && !reports.length) return <Loader />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Safety Registry</Text>
                    <Text style={styles.headerSubtitle}>{reports.length} Reports in {filter} queue</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.filterContainer}>
                {['pending', 'resolved', 'dismissed'].map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.activeFilter]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search incidents by target or reporter..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            <FlatList
                data={reports}
                renderItem={renderReportItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={fetchReports}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <CheckCircle size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Safety queue clear!</Text>
                    </View>
                }
            />

            {/* Resolution Modal */}
            <Modal
                visible={!!selectedReport}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setSelectedReport(null)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.modalCloseBtn}>
                            <XCircle size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>Mediation Console</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {selectedReport && (
                            <>
                                <View style={styles.riskCard}>
                                    <View style={styles.riskInfo}>
                                        <Text style={styles.riskLabel}>Risk Weight</Text>
                                        <Text style={styles.riskValue}>{selectedReport.weight.toFixed(1)}x</Text>
                                    </View>
                                    <View style={styles.severityTag}>
                                        <ShieldAlert size={16} color="#EF4444" />
                                        <Text style={styles.severityTagText}>{selectedReport.reason.replace(/_/g, ' ')}</Text>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Incident Evidence</Text>
                                    <View style={styles.evidenceBox}>
                                        <MessageSquare size={16} color="#2563EB" style={styles.quoteIcon} />
                                        <Text style={styles.evidenceText}>"{selectedReport.description}"</Text>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Decision Rational</Text>
                                    <TextInput
                                        style={styles.actionInput}
                                        placeholder="Provide justification for this decision..."
                                        multiline
                                        numberOfLines={4}
                                        value={actionNotes}
                                        onChangeText={setActionNotes}
                                        editable={filter === 'pending'}
                                    />
                                </View>

                                {filter === 'pending' && (
                                    <View style={styles.directiveRow}>
                                        <TouchableOpacity
                                            style={[styles.directiveBtn, styles.removeBtn]}
                                            onPress={() => executeResolution('block_listing')}
                                            disabled={actionLoading}
                                        >
                                            <Trash2 size={20} color="#FFFFFF" />
                                            <Text style={styles.directiveText}>Remove Room</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.directiveBtn, styles.banBtn]}
                                            onPress={() => executeResolution('block_user')}
                                            disabled={actionLoading}
                                        >
                                            <ShieldAlert size={20} color="#FFFFFF" />
                                            <Text style={styles.directiveText}>Ban User</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.directiveBtn, styles.dismissBtn]}
                                            onPress={() => executeResolution('dismiss')}
                                            disabled={actionLoading}
                                        >
                                            <XCircle size={20} color="#FFFFFF" />
                                            <Text style={styles.directiveText}>Dismiss</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        justifyContent: 'space-between'
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTextContainer: { alignItems: 'center', flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginTop: 2 },
    filterContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 8
    },
    filterBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F3F4F6'
    },
    activeFilter: { backgroundColor: '#2563EB' },
    filterText: { fontSize: 10, fontWeight: '900', color: '#6B7280', textTransform: 'uppercase' },
    activeFilterText: { color: '#FFFFFF' },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
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
    listContent: { padding: 20 },
    reportCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    selectedCard: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    severityText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
    dateText: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
    targetInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    targetIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    targetTextContainer: { flex: 1, marginLeft: 12 },
    targetTitle: { fontSize: 13, fontWeight: '800', color: '#111827', textTransform: 'uppercase' },
    reporterText: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginTop: 2 },
    descriptionSnippet: { fontSize: 12, fontWeight: '600', color: '#4B5563', fontStyle: 'italic', lineHeight: 18, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { fontSize: 14, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginTop: 16 },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        justifyContent: 'space-between'
    },
    modalCloseBtn: { width: 44, height: 44, justifyContent: 'center' },
    modalHeaderTitle: { fontSize: 16, fontWeight: '900', color: '#111827', textTransform: 'uppercase' },
    modalBody: { flex: 1, padding: 20 },
    riskCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    riskInfo: { gap: 4 },
    riskLabel: { fontSize: 9, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase' },
    riskValue: { fontSize: 28, fontWeight: '900', color: '#2563EB' },
    severityTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    severityTagText: { fontSize: 10, fontWeight: '900', color: '#EF4444', textTransform: 'uppercase' },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    evidenceBox: { backgroundColor: '#EFF6FF', borderRadius: 24, padding: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#2563EB' },
    quoteIcon: { marginBottom: 12 },
    evidenceText: { fontSize: 15, fontWeight: '600', color: '#1E40AF', lineHeight: 24, fontStyle: 'italic' },
    actionInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 20,
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        textAlignVertical: 'top',
        minHeight: 120
    },
    directiveRow: { gap: 12 },
    directiveBtn: { flex: 1, height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    removeBtn: { backgroundColor: '#EF4444' },
    banBtn: { backgroundColor: '#111827' },
    dismissBtn: { backgroundColor: '#10B981' },
    directiveText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 }
});

export default AdminReportsScreen;
