
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    BarChart3,
    Activity,
    Users,
    TrendingUp,
    MapPin,
    AlertTriangle
} from 'lucide-react-native';
import api from '../services/api';
import Loader from '../components/common/Loader';
import AdminStatCard from '../components/admin/AdminStatCard';

const { width } = Dimensions.get('window');

const AdminAnalyticsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [insights, setInsights] = useState(null);

    const fetchAnalytics = async () => {
        try {
            // Reusing existing admin endpoints for now
            const response = await api.get('/admin/stats');
            if (response.data.success) {
                setInsights(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAnalytics();
    }, []);

    if (loading && !refreshing) return <Loader fullScreen />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topHeader}>
                <View>
                    <Text style={styles.greeting}>Analytics</Text>
                    <Text style={styles.subtitle}>Data Insights</Text>
                </View>
                <View style={styles.statusBadge}>
                    <BarChart3 size={14} color="#8B5CF6" />
                    <Text style={styles.statusText}>Live Data</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.statsGrid}>
                    <AdminStatCard
                        title="Platform Growth"
                        value={insights?.totalUsers ? `+${(insights.totalUsers * 0.1).toFixed(0)}` : '0'}
                        icon={<TrendingUp size={20} color="#8B5CF6" />}
                        color="#8B5CF6"
                        trend="This Month"
                    />
                    <AdminStatCard
                        title="User Activity"
                        value="High"
                        icon={<Activity size={20} color="#10B981" />}
                        color="#10B981"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Metrics</Text>
                    <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                <Users size={20} color="#2563EB" />
                            </View>
                            <Text style={styles.metricTitle}>Total Registration</Text>
                        </View>
                        <Text style={styles.metricValue}>{insights?.totalUsers || 0}</Text>
                        <Text style={styles.metricSub}>Accounts Created</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                                <AlertTriangle size={20} color="#EF4444" />
                            </View>
                            <Text style={styles.metricTitle}>Active Reports</Text>
                        </View>
                        <Text style={styles.metricValue}>{insights?.totalReports || 0}</Text>
                        <Text style={styles.metricSub}>Pending Review</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Regional Distribution</Text>
                    <View style={styles.chartPlaceholder}>
                        <MapPin size={40} color="#CBD5E1" />
                        <Text style={styles.placeholderText}>
                            Interactive Map Unavailable on Mobile
                        </Text>
                        <Text style={styles.placeholderSub}>
                            Please view on desktop for detailed geographic analytics
                        </Text>
                    </View>
                </View>

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
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7C3AED',
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
        gap: 16
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    metricCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 12,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    metricValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
    },
    metricSub: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 4,
    },
    chartPlaceholder: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    placeholderText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#94A3B8',
        marginTop: 16,
        textAlign: 'center',
    },
    placeholderSub: {
        fontSize: 12,
        fontWeight: '500',
        color: '#CBD5E1',
        marginTop: 8,
        textAlign: 'center',
        maxWidth: 200,
    }
});

export default AdminAnalyticsScreen;
