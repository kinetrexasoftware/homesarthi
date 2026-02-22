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
    Image,
    Platform
} from 'react-native';
import {
    Heart,
    Calendar,
    MessageSquare,
    Search,
    ChevronRight,
    ShieldCheck,
    Settings,
    User,
    ArrowRight
} from 'lucide-react-native';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { MapPin, Zap, Star } from 'lucide-react-native';
import NotificationBadge from '../components/common/NotificationBadge';

const StudentDashboardScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const [stats, setStats] = useState({ savedRooms: 0, visits: 0, chats: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [recommendedRooms, setRecommendedRooms] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [profileRes, visitsRes, chatsRes, recommendationsRes] = await Promise.all([
                api.get('/users/profile'),
                api.get('/visits/my-visits'),
                api.get('/chat/conversations'),
                api.get('/rooms/recommendations?type=personalized&limit=6').catch(() => ({ data: { success: false } }))
            ]);

            if (profileRes.data.success) {
                const u = profileRes.data.data.user;
                setStats(prev => ({
                    ...prev,
                    savedRooms: (u.savedRooms && Array.isArray(u.savedRooms)) ? u.savedRooms.length : 0
                }));
            }
            if (visitsRes.data.success) {
                setStats(prev => ({ ...prev, visits: visitsRes.data.data.visits?.length || 0 }));
            }
            if (chatsRes.data.success) {
                const conversations = chatsRes.data.data.conversations || [];
                const unreadTotal = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
                setStats(prev => ({
                    ...prev,
                    chats: unreadTotal,
                    hasUnreadChats: unreadTotal > 0
                }));
            }
            if (recommendationsRes.data.success) {
                setRecommendedRooms(recommendationsRes.data.data.recommendations || []);
            }
        } catch (error) {
            console.error('Student Dashboard error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setRecommendationsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>Good morning,</Text>
                    <Text style={styles.headerTitle}>{user?.name?.split(' ')[0]}</Text>
                    {user?.customId && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2563EB', marginTop: 2 }}>ID: {user.customId}</Text>
                    )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <NotificationBadge size={24} color="#111827" />
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={styles.profileBtn}
                    >
                        <Image
                            source={{ uri: user?.avatar?.url || `https://ui-avatars.com/api/?name=${user?.name}` }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('SavedRooms')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FFF1F2' }]}>
                        <Heart size={20} color="#E11D48" />
                    </View>
                    <Text style={styles.statVal}>{stats.savedRooms}</Text>
                    <Text style={styles.statLab}>Saved</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Visits')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                        <Calendar size={20} color="#2563EB" />
                    </View>
                    <Text style={styles.statVal}>{stats.visits}</Text>
                    <Text style={styles.statLab}>Visits</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Chat')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                        <MessageSquare size={20} color="#4F46E5" />
                        {stats.hasUnreadChats && <View style={styles.unreadStatDot} />}
                    </View>
                    <Text style={[styles.statVal, stats.hasUnreadChats && { color: '#EF4444' }]}>
                        {stats.chats}
                    </Text>
                    <Text style={styles.statLab}>New Msgs</Text>
                </TouchableOpacity>
            </View>

            {/* AI Recommendations */}
            <View style={[styles.section, { marginTop: 24 }]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended for You</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                        <Text style={styles.viewAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {recommendationsLoading ? (
                    <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 20 }} />
                ) : recommendedRooms.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendScroll}>
                        {recommendedRooms.map((room) => (
                            <TouchableOpacity
                                key={room._id}
                                style={styles.recommendCard}
                                onPress={() => navigation.navigate('RoomDetails', { roomId: room._id })}
                            >
                                <Image
                                    source={{ uri: room.images?.[0]?.url || 'https://via.placeholder.com/400x300' }}
                                    style={styles.recommendImage}
                                />
                                {room.recommendationScore && (
                                    <View style={styles.matchBadge}>
                                        <Text style={styles.matchText}>{room.recommendationScore}% Match</Text>
                                    </View>
                                )}
                                <View style={styles.recommendInfo}>
                                    <View style={styles.recommendHeader}>
                                        <Text style={styles.recommendPrice}>₹{room.rent?.amount}</Text>
                                        <View style={styles.ratingRow}>
                                            <Star size={10} color="#FBBF24" fill="#FBBF24" />
                                            <Text style={styles.ratingText}>{room.rating?.average || 'New'}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.recommendTitle} numberOfLines={1}>{room.title}</Text>
                                    <View style={styles.recommendLoc}>
                                        <MapPin size={10} color="#6B7280" />
                                        <Text style={styles.recommendLocText} numberOfLines={1}>
                                            {room.location?.address?.city || 'Lucknow'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyActivity}>
                        <Text style={styles.emptyText}>Tell us what you like to get smart recommendations</Text>
                        <TouchableOpacity
                            style={styles.exploreBtn}
                            onPress={() => navigation.navigate('Explore')}
                        >
                            <Text style={styles.exploreBtnText}>Start Browsing</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Profile Overview */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Status</Text>
                <View style={styles.profileOverview}>
                    <View style={styles.infoRow}>
                        <View style={styles.statusLabel}>
                            <ShieldCheck size={18} color="#10B981" />
                            <Text style={styles.statusText}>Identity Verified</Text>
                        </View>
                        <Text style={styles.activeText}>Active</Text>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.profileLink}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={styles.linkInfo}>
                            <User size={20} color="#6B7280" />
                            <Text style={styles.linkText}>Complete Profile</Text>
                        </View>
                        <ChevronRight size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Activity (Placeholder/Simple) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Saved Room</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                        <Text style={styles.viewAll}>Explore More</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.emptyActivity}>
                    <Text style={styles.emptyText}>Start exploring to see your activity here</Text>
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => navigation.navigate('Explore')}
                    >
                        <Text style={styles.exploreBtnText}>Browse Rooms</Text>
                        <ArrowRight size={16} color="#2563EB" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    profileBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#EFF6FF',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLab: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    unreadStatDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    searchCard: {
        margin: 24,
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    searchTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    searchDesc: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    searchBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#2563EB',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    profileOverview: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    activeText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    profileLink: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    linkInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAll: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyActivity: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    exploreBtnText: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 15,
    },
    recommendScroll: {
        marginTop: 8,
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    recommendCard: {
        width: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    recommendImage: {
        width: '100%',
        height: 120,
    },
    matchBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    matchText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    recommendInfo: {
        padding: 12,
    },
    recommendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    recommendPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
    },
    recommendTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    recommendLoc: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    recommendLocText: {
        fontSize: 10,
        color: '#9CA3AF',
    }
});

export default StudentDashboardScreen;
