import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Search, MapPin, Shield, Star, TrendingUp, Users, ArrowRight,
    Home as HomeIcon, CheckCircle, Smartphone, FileText, MessageCircle, Key,
    Plus, Minus, HelpCircle, Sparkles, Zap, Target, ShieldCheck
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { SERVER_URL } from '../constants/config';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const HomeScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const isAuthenticated = useAuthStore((state) => state?.isAuthenticated);

    const [featuredRooms, setFeaturedRooms] = useState([]);
    const [trendingRooms, setTrendingRooms] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [testimonials, setTestimonials] = useState([]);
    // const [activity, setActivity] = useState([]); // Can add if UI space permits
    const [locations, setLocations] = useState([]);

    // Carousel State
    const [activeSlide, setActiveSlide] = useState(0);
    const slideRef = useRef(null);

    const carouselData = [
        {
            image: require('../../assets/trust-verified-cartoon.png'),
            title: '100% Verified Owners',
            description: 'Every listing is checked by our team. No scams, just safe homes.'
        },
        {
            image: require('../../assets/zero-brokerage-cartoon.png'),
            title: 'Zero Brokerage',
            description: 'Save thousands! Connect directly with owners, no middleman fees.'
        },
        {
            image: require('../../assets/why-choose-us.png'),
            title: 'Community First',
            description: 'Join thousands of happy students finding their perfect room.'
        }
    ];

    // Auto-scroll logic
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => {
                const nextSlide = prev === carouselData.length - 1 ? 0 : prev + 1;
                slideRef.current?.scrollTo({ x: nextSlide * (width - 48), animated: true });
                return nextSlide;
            });
        }, 3000); // 3 seconds for readability

        return () => clearInterval(interval);
    }, []);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // New States for interactivity
    const [howItWorksTab, setHowItWorksTab] = useState('student');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const toggleFaq = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    const studentSteps = [
        { icon: <Search size={20} color="#FFF" />, title: 'Smart Search', desc: 'Find premium rooms near your college instantly.' },
        { icon: <ShieldCheck size={20} color="#FFF" />, title: 'Verified Only', desc: 'Every room is manually vetted for your safety.' },
        { icon: <MessageCircle size={20} color="#FFF" />, title: 'Direct Chat', desc: 'Talk to owners directly. Save ₹10k+ in brokerage.' },
        { icon: <Sparkles size={20} color="#FFF" />, title: 'Happy Living', desc: 'Move in and enjoy a hassle-free student life.' }
    ];

    const ownerSteps = [
        { icon: <Target size={20} color="#FFF" />, title: 'Post Ad', desc: 'List your property to reach 10,000+ students.' },
        { icon: <Zap size={20} color="#FFF" />, title: 'Quick Approval', desc: 'Get your listing verified in under 24 hours.' },
        { icon: <Users size={20} color="#FFF" />, title: 'Get Inquiries', desc: 'Interested students will chat with you directly.' },
        { icon: <HomeIcon size={20} color="#FFF" />, title: 'Rent Out', desc: 'Fill your vacancies with verified student tenants.' }
    ];

    const faqs = [
        { q: "Is HomeSarthi free for students?", a: "Yes, it is 100% free for students. No hidden charges or commissions." },
        { q: "How do I contact an owner?", a: "Simply click the 'Chat' button on any room page to start a direct conversation." },
        { q: "Are the listings verified?", a: "Yes, we verify ownership documents for every listing to ensure your safety." },
        { q: "Can I list my property for free?", a: "Yes! Owners can list their property for free and connect with students." },
        { q: "Is my personal data safe?", a: "Absolutely. We use industry-standard encryption and never share your data." },
        { q: "What is Zero Brokerage?", a: "It means you pay directly to the owner. There is no middleman or fee." },
        { q: "How to schedule a visit?", a: "You can ask the owner in the chat for a convenient time to visit." }
    ];

    const fetchHomeData = async () => {
        try {
            const [roomsRes, trendingRes, metricsRes, testimonialsRes, locationsRes] =
                await Promise.allSettled([
                    api.get('/rooms?limit=4&sortBy=-createdAt'),
                    api.get('/rooms/trending?type=trending&limit=6'),
                    api.get('/metrics/home'),
                    api.get('/testimonials?limit=3'),
                    api.get('/locations/featured')
                ]);

            if (roomsRes.status === 'fulfilled') setFeaturedRooms(roomsRes.value.data.data.rooms || []);
            if (trendingRes.status === 'fulfilled') setTrendingRooms(trendingRes.value.data.data.recommendations || []);
            if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data.data);
            if (testimonialsRes.status === 'fulfilled') setTestimonials(testimonialsRes.value.data.data);
            if (locationsRes.status === 'fulfilled') setLocations(locationsRes.value.data.data);

        } catch (error) {
            console.error('Failed to fetch home data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHomeData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHomeData();
    };

    const stats = [
        { number: '10K+', label: 'Happy Students' },
        { number: '5K+', label: 'Verified Rooms' },
        { number: '500+', label: 'Colleges' },
        { number: '50+', label: 'Cities' }
    ];

    const renderRoomCard = (room) => (
        <TouchableOpacity
            key={room._id}
            style={styles.roomCard}
            onPress={() => navigation.navigate('RoomDetails', { roomId: room._id })}
        >
            <Image
                source={{ uri: room.images?.[0]?.url || 'https://via.placeholder.com/400x300' }}
                style={styles.roomImage}
            />
            <View style={styles.roomInfo}>
                <Text style={styles.roomTitle} numberOfLines={1}>{room.title}</Text>
                <View style={styles.roomLocation}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {[room.location?.address?.area, room.location?.address?.city]
                            .filter(Boolean)
                            .join(', ') || 'Location not specified'}
                    </Text>
                </View>
                <Text style={styles.roomPrice}>₹{room.rent?.amount}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                }
            >
                {/* Hero Section */}
                <LinearGradient
                    colors={['#EFF6FF', '#FAF5FF']}
                    style={styles.hero}
                >
                    <View style={styles.badge}>
                        <Shield size={14} color="#2563EB" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeText}>
                            {metrics ? `Verified in ${metrics.citiesCovered || 1} Cities` : '#1 Student Housing Platform'}
                        </Text>
                    </View>
                    <Text style={styles.heroTitle}>
                        Find Your Perfect{"\n"}
                        <Text style={styles.gradientText}>Student Room</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Discover verified rental rooms near your college. Safe, affordable, and perfect for students.
                    </Text>

                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={() => navigation.navigate('Explore')}
                    >
                        <Search size={20} color="#9CA3AF" />
                        <Text style={styles.searchPlaceholder}>Search by city, college, or area...</Text>
                    </TouchableOpacity>

                    {/* Trust Signals */}
                    <View style={styles.trustSignals}>
                        <View style={styles.trustItem}>
                            <CheckCircle size={14} color="#10B981" />
                            <Text style={styles.trustText}>Verified Owners</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <CheckCircle size={14} color="#10B981" />
                            <Text style={styles.trustText}>No Brokers</Text>
                        </View>
                    </View>

                    <View style={styles.heroButtons}>
                        {isAuthenticated ? (
                            <>
                                <TouchableOpacity
                                    style={styles.primaryBtn}
                                    onPress={() => navigation.navigate(user?.role === 'owner' ? 'CreateRoom' : 'Explore')}
                                >
                                    <Text style={styles.primaryBtnText}>
                                        {user?.role === 'owner' ? 'List Room' : 'Explore Rooms'}
                                    </Text>
                                    <ArrowRight size={18} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryBtn}
                                    onPress={() => {
                                        const role = user?.role;
                                        if (role === 'admin') navigation.navigate('AdminDashboard');
                                        else if (role === 'owner') navigation.navigate('OwnerDashboard');
                                        else navigation.navigate('StudentDashboard');
                                    }}
                                >
                                    <Text style={styles.secondaryBtnText}>My Dashboard</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.primaryBtn}
                                    onPress={() => navigation.navigate('Register', { role: 'student' })}
                                >
                                    <Text style={styles.primaryBtnText}>I'm a Student</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryBtn}
                                    onPress={() => navigation.navigate('Register', { role: 'owner' })}
                                >
                                    <Text style={styles.secondaryBtnText}>I'm an Owner</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </LinearGradient>

                {/* Real Metrics Section (Only if data exists) */}
                {metrics && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{metrics.activeListings || 0}</Text>
                            <Text style={styles.statLabel}>Active Rooms</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{metrics.verifiedOwners || 0}</Text>
                            <Text style={styles.statLabel}>Verified Owners</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{metrics.citiesCovered || 1}</Text>
                            <Text style={styles.statLabel}>Cities</Text>
                        </View>
                    </View>
                )}

                {/* Featured Locations */}
                {locations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Popular Cities</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 24 }}>
                            {locations.map((loc, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.locationChip}
                                    onPress={() => navigation.navigate('Explore', { city: loc.cityName })}
                                >
                                    <MapPin size={14} color="#4B5563" />
                                    <Text style={styles.locationChipText}>{loc.cityName}</Text>
                                    <View style={styles.locationCountBadge}>
                                        <Text style={styles.locationCountText}>{loc.listingCount}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Why Choose Us Section (Carousel) */}
                <View style={[styles.section, { backgroundColor: '#F9FAFB', paddingBottom: 40 }]}>
                    <Text style={styles.sectionTitle}>Why Choose HomeSarthi?</Text>

                    <View style={styles.carouselContainer}>
                        <ScrollView
                            ref={slideRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(event) => {
                                const index = Math.round(event.nativeEvent.contentOffset.x / (width - 48));
                                setActiveSlide(index);
                            }}
                            style={{ width: width - 48, height: 320 }}
                        >
                            {carouselData.map((item, index) => (
                                <View key={index} style={styles.slide}>
                                    <Image
                                        source={item.image}
                                        style={styles.slideImage}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.slideContent}>
                                        <Text style={styles.slideTitle}>{item.title}</Text>
                                        <Text style={styles.slideDesc}>{item.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Pagination Dots */}
                        <View style={styles.pagination}>
                            {carouselData.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        activeSlide === index ? styles.activeDot : styles.inactiveDot
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Featured Rooms */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recently Added</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.roomsScroll}
                        >
                            {featuredRooms.map(renderRoomCard)}
                        </ScrollView>
                    )}
                </View>

                {/* Trending Rooms Section */}
                {trendingRooms.length > 0 && (
                    <View style={[styles.section, { paddingTop: 0 }]}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.sectionTitle}>Trending Now</Text>
                                <TrendingUp size={16} color="#EF4444" />
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Explore', { sortBy: '-views' })}>
                                <Text style={styles.seeAll}>Popular</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.roomsScroll}
                        >
                            {trendingRooms.map((room) => (
                                <TouchableOpacity
                                    key={`trending-${room._id}`}
                                    style={[styles.roomCard, { width: 220, borderColor: '#FEE2E2' }]}
                                    onPress={() => navigation.navigate('RoomDetails', { roomId: room._id })}
                                >
                                    <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <TrendingUp size={10} color="#FFF" />
                                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>HOT</Text>
                                    </View>
                                    <Image
                                        source={{ uri: room.images?.[0]?.url || 'https://via.placeholder.com/400x300' }}
                                        style={[styles.roomImage, { height: 120 }]}
                                    />
                                    <View style={styles.roomInfo}>
                                        <Text style={styles.roomTitle} numberOfLines={1}>{room.title}</Text>
                                        <Text style={[styles.roomPrice, { fontSize: 16 }]}>₹{room.rent?.amount}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                            <Star size={10} color="#F59E0B" fill="#F59E0B" />
                                            <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: 'bold' }}>Most Viewed</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* How It Works Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>

                    {/* Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, howItWorksTab === 'student' && styles.activeToggleBtn]}
                            onPress={() => setHowItWorksTab('student')}
                        >
                            <Text style={[styles.toggleText, howItWorksTab === 'student' && styles.activeToggleText]}>For Students</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, howItWorksTab === 'owner' && styles.activeToggleBtn]}
                            onPress={() => setHowItWorksTab('owner')}
                        >
                            <Text style={[styles.toggleText, howItWorksTab === 'owner' && styles.activeToggleText]}>For Owners</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Chain Structure */}
                    <View style={styles.stepsContainer}>
                        {(howItWorksTab === 'student' ? studentSteps : ownerSteps).map((step, index, arr) => (
                            <View key={index} style={styles.stepItem}>
                                <View style={styles.stepLeft}>
                                    <View style={[styles.stepIconCtx, { backgroundColor: howItWorksTab === 'student' ? '#2563EB' : '#7C3AED' }]}>
                                        {step.icon}
                                    </View>
                                    {index !== arr.length - 1 && <View style={styles.stepLine} />}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                    <Text style={styles.stepDesc}>{step.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={[styles.section, { backgroundColor: '#F0F9FF', borderTopLeftRadius: 30, borderTopRightRadius: 30 }]}>
                    <View style={styles.faqHeaderSection}>
                        <View>
                            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Have Questions?</Text>
                            <Text style={styles.sectionSubtitle}>We're here to help you 24/7</Text>
                        </View>
                        <Image
                            source={require('../../assets/faq-help.png')}
                            style={styles.faqIllustration}
                            resizeMode="contain"
                        />
                    </View>
                    {faqs.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.faqCard}
                            activeOpacity={0.8}
                            onPress={() => toggleFaq(index)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{item.q}</Text>
                                {expandedFaq === index ? <Minus size={20} color="#2563EB" /> : <Plus size={20} color="#6B7280" />}
                            </View>
                            {expandedFaq === index && (
                                <Text style={styles.faqAnswer}>{item.a}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* CTA Section */}
                {!isAuthenticated && (
                    <LinearGradient
                        colors={['#2563EB', '#7C3AED']}
                        style={styles.cta}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Users size={32} color="#FFF" style={{ marginBottom: 12 }} />
                        <Text style={styles.ctaTitle}>Ready to find your home?</Text>
                        <Text style={styles.ctaSubtitle}>Join thousands of students on HomeSarthi today.</Text>
                        <TouchableOpacity
                            style={styles.ctaBtn}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.ctaBtnText}>Get Started Free</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    hero: {
        padding: 24,
        paddingTop: 32,
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    badgeText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 16,
    },
    gradientText: {
        color: '#2563EB',
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        width: '100%',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    searchPlaceholder: {
        marginLeft: 12,
        color: '#9CA3AF',
        fontSize: 15,
    },
    trustSignals: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    trustText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500'
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: '#2563EB',
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    primaryBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    secondaryBtn: {
        flex: 1,
        backgroundColor: '#FFF',
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    secondaryBtnText: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 24,
        paddingVertical: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        justifyContent: 'space-around'
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2563EB',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    section: {
        padding: 24,
        paddingBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    seeAll: {
        color: '#2563EB',
        fontWeight: '700',
        fontSize: 14,
    },
    locationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    locationChipText: {
        color: '#1E293B',
        fontSize: 14,
        fontWeight: '700'
    },
    locationCountBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    locationCountText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#2563EB'
    },
    roomsScroll: {
        paddingRight: 24,
        gap: 16,
    },
    roomCard: {
        width: 260,
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    roomImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#F3F4F6'
    },
    roomInfo: {
        padding: 16,
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    roomLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    locationText: {
        fontSize: 13,
        color: '#6B7280',
    },
    roomPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB',
    },
    testimonialCard: {
        width: 280,
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 20,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    testimonialText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    testimonialName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    testimonialSub: {
        fontSize: 12,
        color: '#6B7280',
    },
    cta: {
        margin: 24,
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    ctaSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    ctaBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
    },
    ctaBtnText: {
        color: '#2563EB',
        fontWeight: '800',
        fontSize: 15,
    },
    carouselContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    slide: {
        width: width - 48, // Full width minus padding
        alignItems: 'center',
        justifyContent: 'center',
    },
    slideImage: {
        width: '90%',
        height: 220,
        marginBottom: 20,
        borderRadius: 24,
        borderWidth: 4,
        borderColor: '#FFF',
        backgroundColor: '#F3F4F6',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    slideContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    slideTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    slideDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    pagination: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeDot: {
        backgroundColor: '#2563EB',
        width: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeToggleBtn: {
        backgroundColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeToggleText: {
        color: '#111827',
        fontWeight: '700',
    },
    stepsContainer: {
        paddingHorizontal: 16,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    stepLeft: {
        alignItems: 'center',
        marginRight: 16,
        width: 40,
    },
    stepIconCtx: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    stepContent: {
        flex: 1,
        paddingVertical: 4,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    stepDesc: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
    },
    faqCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0F2FE',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    faqHeaderSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    faqIllustration: {
        width: 100,
        height: 100,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        marginRight: 16,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    }
});

export default HomeScreen;

