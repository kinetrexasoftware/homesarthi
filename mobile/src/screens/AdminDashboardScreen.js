import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Users,
    Home,
    AlertTriangle,
    ShieldCheck,
    ShieldAlert,
    Zap,
    ChevronRight,
    Activity,
    Clock,
    Search,
    MapPin,
    BarChart3
} from 'lucide-react-native';
import api from '../services/api';
import AdminStatCard from '../components/admin/AdminStatCard';
import Loader from '../components/common/Loader';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
    const [stats, setStats] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [geoRisk, setGeoRisk] = useState([]);
    const [reportAnalytics, setReportAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, auditRes, geoRes, analyticsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/audit-logs'),
                api.get('/admin/analytics/geo-risk'),
                api.get('/admin/analytics/reports')
            ]);

            if (statsRes.data.success) setStats(statsRes.data.data);
            if (auditRes.data.success) setAuditLogs(auditRes.data.data);
            if (geoRes.data.success) setGeoRisk(geoRes.data.data);
            if (analyticsRes.data.success) setReportAnalytics(analyticsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch admin dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, []);

    if (loading && !refreshing) return <Loader fullScreen />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topHeader}>
                <View>
                    <Text style={styles.greeting}>Admin Hub</Text>
                    <Text style={styles.subtitle}>Trust Layer Governance</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Activity size={14} color="#10B981" />
                    <Text style={styles.statusText}>99.9% Health</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.statsGrid}>
                    <AdminStatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={<Users size={20} color="#2563EB" />}
                        color="#2563EB"
                        trend="+12%"
                        onPress={() => navigation.navigate('AdminUserManagement')}
                    />
                    <AdminStatCard
                        title="Active Rooms"
                        value={stats?.totalRooms || 0}
                        icon={<Home size={20} color="#10B981" />}
                        color="#10B981"
                        trend="+5%"
                        onPress={() => navigation.navigate('AdminRooms', { filter: 'active' })}
                    />
                    <AdminStatCard
                        title="Room Approvals"
                        value={stats?.pendingRooms || 0}
                        icon={<ShieldAlert size={20} color="#EF4444" />}
                        color="#EF4444"
                        onPress={() => navigation.navigate('AdminRooms', { filter: 'pending' })}
                    />
                    <AdminStatCard
                        title="Owner Verifications"
                        value={stats?.pendingOwners || 0}
                        icon={<ShieldCheck size={20} color="#F59E0B" />}
                        color="#F59E0B"
                        onPress={() => navigation.navigate('AdminUserManagement', { filter: 'owner', status: 'unverified' })}
                    />
                    <AdminStatCard
                        title="Safety Flags"
                        value={stats?.totalReports || 0}
                        icon={<AlertTriangle size={20} color="#EF4444" />}
                        color="#EF4444"
                        onPress={() => navigation.navigate('AdminReports')}
                    />
                    <AdminStatCard
                        title="System"
                        value="Optimal"
                        icon={<Zap size={20} color="#100081" />}
                        color="#100081"
                    />
                </View>

                {/* Quick Management */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Management Console</Text>
                    <View style={styles.menuGrid}>
                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => navigation.navigate('AdminUserManagement')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
                                <Users size={24} color="#2563EB" />
                            </View>
                            <Text style={styles.menuLabel}>Users</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => navigation.navigate('AdminRooms')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: '#D1FAE5' }]}>
                                <Home size={24} color="#10B981" />
                            </View>
                            <Text style={styles.menuLabel}>Listings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => navigation.navigate('AdminReports')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                                <AlertTriangle size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.menuLabel}>Safety</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => navigation.navigate('AdminAnalytics')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: '#EDE9FE' }]}>
                                <BarChart3 size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.menuLabel}>Analytics</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Audit Trail */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>System Audit Trail</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AdminAudit')}>
                            <Text style={styles.seeAll}>History</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.auditContainer}>
                        {auditLogs.length > 0 ? auditLogs.slice(0, 5).map((log) => (
                            <View key={log._id} style={styles.auditItem}>
                                <View style={[styles.auditIcon, { backgroundColor: log.action.includes('REJECT') || log.action.includes('BLOCK') ? '#FEE2E2' : '#D1FAE5' }]}>
                                    <Clock size={16} color={log.action.includes('REJECT') || log.action.includes('BLOCK') ? '#EF4444' : '#10B981'} />
                                </View>
                                <View style={styles.auditInfo}>
                                    <View style={styles.auditMeta}>
                                        <Text style={styles.auditAdmin}>{log.admin?.name || 'System Navigator'}</Text>
                                        <Text style={styles.auditTime}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
                                    </View>
                                    <Text style={styles.auditAction}>{log.action.replace(/_/g, ' ')}</Text>
                                    {log.targetName && <Text style={styles.auditTarget}>→ {log.targetName}</Text>}
                                </View>
                            </View>
                        )) : (
                            <View style={styles.emptyAudit}>
                                <Activity size={24} color="#E5E7EB" />
                                <Text style={styles.emptyNote}>Awaiting system occurrences...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Risk Hotspots */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Regional Risk Hotspots</Text>
                    <View style={styles.riskGrid}>
                        {geoRisk.length > 0 ? geoRisk.slice(0, 5).map((risk, index) => (
                            <View key={index} style={styles.riskItem}>
                                <View style={styles.riskHeader}>
                                    <View style={styles.zoneInfo}>
                                        <MapPin size={10} color="#6B7280" />
                                        <Text style={styles.riskZone}>{risk._id || 'Unknown Region'}</Text>
                                    </View>
                                    <View style={[styles.riskBadge, { backgroundColor: risk.avgScore > 3 ? '#FEE2E2' : '#FEF3C7' }]}>
                                        <Text style={[styles.riskScore, { color: risk.avgScore > 3 ? '#EF4444' : '#D97706' }]}>{risk.avgScore.toFixed(1)} Index</Text>
                                    </View>
                                </View>
                                <View style={styles.riskBar}>
                                    <View style={[styles.riskProgress, { width: `${Math.min((risk.avgScore / 10) * 100, 100)}%`, backgroundColor: risk.avgScore > 3 ? '#EF4444' : '#F59E0B' }]} />
                                </View>
                            </View>
                        )) : (
                            <Text style={styles.emptyNote}>No risk data mapped yet.</Text>
                        )}
                    </View>
                </View>

                {/* Severity Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Incident Severity Index</Text>
                    <View style={styles.severityGrid}>
                        {reportAnalytics?.severity ? reportAnalytics.severity.map((item, idx) => (
                            <View key={idx} style={styles.severityBarItem}>
                                <View style={styles.severityHeader}>
                                    <Text style={styles.severityLabel}>{item._id.replace(/_/g, ' ')}</Text>
                                    <Text style={styles.severityValue}>{item.count} Reports</Text>
                                </View>
                                <View style={styles.severityTrack}>
                                    <View style={[styles.severityFill, {
                                        width: `${Math.min((item.count / 20) * 100, 100)}%`,
                                        backgroundColor: ['scam_fraud', 'privacy_violation'].includes(item._id) ? '#EF4444' : '#F59E0B'
                                    }]} />
                                </View>
                            </View>
                        )) : (
                            ['Security', 'Privacy', 'Scam'].map((label, idx) => (
                                <View key={idx} style={styles.severityBarItem}>
                                    <View style={styles.severityHeader}>
                                        <Text style={styles.severityLabel}>{label}</Text>
                                        <Text style={styles.severityValue}>Stable</Text>
                                    </View>
                                    <View style={styles.severityTrack}>
                                        <View style={[styles.severityFill, { width: '10%', backgroundColor: '#10B981' }]} />
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    greeting: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginTop: 4,
        letterSpacing: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#065F46',
        textTransform: 'uppercase',
    },
    scrollView: {
        flex: 1,
    },
    statsGrid: {
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    seeAll: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    menuCard: {
        width: (width - 44) / 2, // 32 (padding) + 12 (gap) = 44
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
    },
    auditContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    auditItem: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
    },
    auditIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    auditInfo: {
        flex: 1,
    },
    auditMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    auditAdmin: {
        fontSize: 11,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
    },
    auditTime: {
        fontSize: 9,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    auditAction: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'capitalize',
        marginTop: 2,
    },
    auditTarget: {
        fontSize: 9,
        fontWeight: '900',
        color: '#2563EB',
        marginTop: 2,
    },
    riskGrid: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 20,
    },
    riskItem: {},
    riskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    riskZone: {
        fontSize: 12,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
    },
    riskBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    riskScore: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    riskBar: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    riskProgress: {
        height: '100%',
        borderRadius: 3,
    },
    zoneInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    emptyNote: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    severityGrid: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 20,
    },
    severityBarItem: {
        gap: 8,
    },
    severityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    severityLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
    },
    severityValue: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6B7280',
    },
    severityTrack: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    severityFill: {
        height: '100%',
        borderRadius: 4,
    },
    emptyAudit: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    seeAll: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
    },
});

export default AdminDashboardScreen;
