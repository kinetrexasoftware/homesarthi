import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Platform,
    Alert
} from 'react-native';
import {
    Eye,
    MessageCircle,
    Calendar,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Zap,
    AlertCircle,
    Clock,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Target,
    DollarSign,
    RefreshCw,
    Headphones
} from 'lucide-react-native';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import NotificationBadge from '../components/common/NotificationBadge';

const { width } = Dimensions.get('window');

const OwnerDashboardScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState('7');
    const [analytics, setAnalytics] = useState(null);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            const { data } = await api.get('/analytics/owner/comprehensive', {
                params: { period: period === '7' ? '7days' : '30days' }
            });

            if (data.success) {
                setAnalytics(data.data);
            } else {
                setError(data.message || 'Failed to load analytics');
            }
        } catch (err) {
            console.error('Dashboard error:', err);
            setError(err.response?.data?.message || 'Connection error. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleAction = (insight) => {
        if (insight?.roomId) {
            navigation.navigate('EditRoom', { roomId: insight.roomId });
        } else if (insight?.action === 'Enable Notifications') {
            Alert.alert('Coming Soon', 'Push notifications will be enabled soon!');
        }
    };

    const getRoomStatus = (room) => {
        if (room.bookings > 0) return { label: 'Doing well', color: '#10B981', bg: '#D1FAE5', icon: CheckCircle };
        if (room.views > 50 && room.inquiries === 0) return { label: 'Needs work', color: '#F59E0B', bg: '#FEF3C7', icon: AlertCircle };
        if (room.price > room.marketAvg * 1.15) return { label: 'Overpriced', color: '#EF4444', bg: '#FEE2E2', icon: TrendingDown };
        if (room.price < room.marketAvg * 0.8) return { label: 'Good Deal', color: '#3B82F6', bg: '#DBEAFE', icon: TrendingUp };
        return { label: 'Active', color: '#6B7280', bg: '#F3F4F6', icon: CheckCircle };
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Fetching your analytics...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <AlertCircle size={48} color="#EF4444" />
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardData}>
                    <RefreshCw size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const overview = analytics?.overview || {};
    const occupancy = analytics?.occupancy || { rate: 0, occupied: 0, total: 0 };
    const insights = analytics?.actionableInsights || [];
    const roomPerformance = analytics?.roomPerformance || [];

    const kpis = [
        { label: 'Total Views', value: overview.totalViews || 0, sub: 'People saw your rooms', icon: Eye, color: '#3B82F6' },
        { label: 'Inquiries', value: overview.inquiries || 0, sub: 'People contacted you', icon: MessageCircle, color: '#8B5CF6' },
        { label: 'Bookings', value: overview.bookings || 0, sub: 'Confirmed tenants', icon: CheckCircle, color: '#10B981' },
        { label: 'Occupancy', value: `${occupancy.rate}%`, sub: `${occupancy.occupied}/${occupancy.total} filled`, icon: Target, color: '#F59E0B' },
        { label: 'Income', value: `₹${(overview.revenue || 0).toLocaleString()}`, sub: 'Estimated earnings', icon: DollarSign, color: '#059669' },
    ];

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Your Dashboard</Text>
                    <Text style={styles.userName}>{user?.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <NotificationBadge size={24} color="#1E293B" />
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('CreateRoom')}
                    >
                        <Plus size={20} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>List Room</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Period Selector */}
            <View style={styles.periodContainer}>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, period === '7' && styles.toggleBtnActive]}
                        onPress={() => setPeriod('7')}
                    >
                        <Text style={[styles.toggleText, period === '7' && styles.toggleTextActive]}>7 Days</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, period === '30' && styles.toggleBtnActive]}
                        onPress={() => setPeriod('30')}
                    >
                        <Text style={[styles.toggleText, period === '30' && styles.toggleTextActive]}>30 Days</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* KPI Cards Horizontal */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.kpiContainer}
                decelerationRate="fast"
                snapToInterval={152}
            >
                {kpis.map((kpi, i) => (
                    <View key={i} style={styles.kpiCard}>
                        <View style={[styles.kpiIconBox, { backgroundColor: `${kpi.color}15` }]}>
                            <kpi.icon size={18} color={kpi.color} />
                        </View>
                        <Text style={styles.kpiLabel}>{kpi.label}</Text>
                        <Text style={styles.kpiValue}>{kpi.value}</Text>
                        <Text style={styles.kpiSub}>{kpi.sub}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Support Center Link */}
            <TouchableOpacity
                style={styles.supportCard}
                onPress={() => navigation.navigate('Support')}
            >
                <View style={styles.supportIconBox}>
                    <Headphones size={24} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.supportTitle}>Support Center</Text>
                    <Text style={styles.supportSub}>Need help with listings or verification? Contact us.</Text>
                </View>
                <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Smart Tips Section */}
            {insights.length > 0 && (
                <View style={[styles.section, { marginTop: 10 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Zap size={18} color="#2563EB" fill="#2563EB30" />
                            <Text style={styles.sectionTitle}>Smart Tips</Text>
                        </View>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 20, paddingBottom: 10 }}
                    >
                        {insights.slice(0, 5).map((tip, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.tipCard, styles[`tipCard_${tip.type}`]]}
                                onPress={() => handleAction(tip)}
                            >
                                <View style={styles.tipHeader}>
                                    <Text style={styles.tipImpact}>{tip.impact}</Text>
                                    <ChevronRight size={14} color="#6B7280" />
                                </View>
                                <Text style={styles.tipTitle} numberOfLines={1}>{tip.title}</Text>
                                <Text style={styles.tipDesc} numberOfLines={2}>{tip.description}</Text>
                                <View style={styles.tipActionRow}>
                                    <Text style={styles.tipActionText}>{tip.action} →</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Room Performance */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Room Performance</Text>
                </View>
                {roomPerformance.length > 0 ? (
                    roomPerformance.map((room) => {
                        const status = getRoomStatus(room);
                        return (
                            <TouchableOpacity
                                key={room.id}
                                style={styles.performanceCard}
                                onPress={() => navigation.navigate('EditRoom', { roomId: room.id })}
                            >
                                <View style={styles.perfInfo}>
                                    <Text style={styles.perfName}>{room.name}</Text>
                                    <View style={styles.perfStatsRow}>
                                        <Text style={styles.perfStatText}>Views: <Text style={{ color: '#111827' }}>{room.views}</Text></Text>
                                        <Text style={styles.perfStatText}>Inquiries: <Text style={{ color: '#111827' }}>{room.inquiries}</Text></Text>
                                    </View>
                                </View>
                                <View style={styles.perfStatus}>
                                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                                        <status.icon size={10} color={status.color} />
                                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                                    </View>
                                    <Text style={styles.perfPrice}>₹{room.price}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyCard}>
                        <Target size={40} color="#CBD5E1" style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>No listing performance data yet</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreateRoom')}>
                            <Text style={styles.emptyBtnText}>Post your first room</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20 },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },
    errorTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 20, marginBottom: 8 },
    errorText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    retryBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    retryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    welcomeText: { fontSize: 11, color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    userName: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
    addBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addBtnText: { color: '#FFFFFF', fontWeight: '800', marginLeft: 6, fontSize: 12 },
    periodContainer: { paddingHorizontal: 20, marginBottom: 20 },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 3, width: 160 },
    toggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
    toggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    toggleText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    toggleTextActive: { color: '#1E293B' },
    kpiContainer: { paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
    kpiCard: {
        backgroundColor: '#FFFFFF',
        width: 140,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
    },
    kpiIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    kpiLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
    kpiValue: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
    kpiSub: { fontSize: 10, color: '#64748B', fontWeight: '500' },
    section: { paddingHorizontal: 20, marginTop: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    tipCard: {
        width: width * 0.75,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    tipCard_critical: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
    tipCard_warning: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
    tipCard_success: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
    tipCard_info: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
    tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tipImpact: { fontSize: 10, fontWeight: '900', color: '#2563EB', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    tipTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    tipDesc: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 12 },
    tipActionRow: { flexDirection: 'row', alignItems: 'center' },
    tipActionText: { fontSize: 11, fontWeight: '900', color: '#2563EB' },
    performanceCard: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    perfInfo: { flex: 1 },
    perfName: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    perfStatsRow: { flexDirection: 'row', gap: 12 },
    perfStatText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
    perfStatus: { alignItems: 'flex-end', gap: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '900' },
    perfPrice: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
    emptyCard: { backgroundColor: '#F8FAFC', padding: 40, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '700', marginBottom: 12 },
    emptyBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    emptyBtnText: { color: '#2563EB', fontWeight: '800', fontSize: 12 },
    supportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        gap: 12,
        marginHorizontal: 24,
        marginTop: 20,
        marginBottom: 8
    },
    supportIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center'
    },
    supportTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B'
    },
    supportSub: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2
    }
});

export default OwnerDashboardScreen;
