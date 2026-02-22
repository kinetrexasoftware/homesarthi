import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Share,
    Alert,
    Modal,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    MapPin,
    ChevronLeft,
    Heart,
    Share2,
    Phone,
    MessageSquare,
    Calendar,
    CheckCircle,
    ShieldCheck,
    Zap,
    Info,
    Star,
    Users,
    X,
    ShieldAlert,
    Bus,
    School,
    Activity,
    Train,
    Map as MapIcon,
    Navigation,
    Star as StarIcon,
    Clock,
    Layers,
    Upload,
    Plus,
    Minus,
    HelpCircle,
    Sparkles,
    Target,
    Wifi,
    Snowflake,
    Droplets,
    Tv,
    Utensils,
    Car,
    Shield,
    Camera,
    WashingMachine,
    Thermometer,
    Dumbbell,
    BookOpen,
    Waves,
    Sun,
    Flame
} from 'lucide-react-native';

const AMENITY_ICONS = {
    wifi: Wifi,
    ac: Snowflake,
    water_purifier: Droplets,
    ro_water: Droplets,
    water: Droplets,
    tv: Tv,
    kitchen: Utensils,
    food: Utensils,
    parking: Car,
    security: Shield,
    cctv: Camera,
    power_backup: Zap,
    electricity: Zap,
    washing_machine: WashingMachine,
    water_heater: Thermometer,
    geyser: Thermometer,
    fridge: Snowflake,
    microwave: Clock,
    gym: Dumbbell,
    study_room: BookOpen,
    laundry: Waves,
    furnished: CheckCircle,
    balcony: Sun,
    heater: Flame,
};

import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import MapViewComponent from '../components/rooms/MapView';
import RoomMapView from '../components/rooms/RoomMapView';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';
import { formatCurrency, formatDistance, fetchNearbyLandmarks } from '../utils/helpers';

const { width } = Dimensions.get('window');


const RoomDetailsScreen = ({ route, navigation }) => {
    const { roomId } = route.params;
    const user = useAuthStore((state) => state?.user);
    const isAuthenticated = useAuthStore((state) => state?.isAuthenticated);

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Visit Modal State
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitNotes, setVisitNotes] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date());
    const [timeValue, setTimeValue] = useState(new Date());

    const [reviews, setReviews] = useState([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewCriteria, setReviewCriteria] = useState({
        cleanliness: 5,
        communication: 5,
        accuracy: 5,
        location: 5,
        value: 5
    });
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [landmarks, setLandmarks] = useState([]);
    const [landmarksLoading, setLandmarksLoading] = useState(false);

    const loadLandmarks = useCallback(async (lat, lng) => {
        try {
            setLandmarksLoading(true);
            const data = await fetchNearbyLandmarks(lat, lng);
            setLandmarks(data);
        } catch (error) {
            console.error('Load landmarks error:', error);
        } finally {
            setLandmarksLoading(false);
        }
    }, []);


    const fetchRoomDetails = useCallback(async () => {
        try {
            setLoading(true);
            console.log(`[RoomDetails] Fetching room: ${roomId}`);
            const { data } = await api.get(`/rooms/${roomId}`);
            console.log(`[RoomDetails] API Response SUCCESS:`, !!data?.data?.room);

            if (data?.success && data?.data?.room) {
                setRoom(data.data.room);
                setReviews(data.data.reviews || []);
                // Load landmarks
                if (data.data.room.location?.coordinates) {
                    loadLandmarks(data.data.room.location.coordinates[1], data.data.room.location.coordinates[0]);
                }
                // Check if user has already reviewed
                if (isAuthenticated && data.data.reviews) {
                    const myReview = data.data.reviews.find(r => (r.student?._id || r.student) === (user?._id || user));
                    if (myReview) {
                        setHasReviewed(true);
                        setReviewRating(myReview.rating);
                        setReviewComment(myReview.comment || '');
                        if (myReview.criteria) setReviewCriteria(myReview.criteria);
                    }
                }
                // Check if user has favorited this room
                if (isAuthenticated && user?.savedRooms) {
                    setIsFavorite(user.savedRooms.some(r => (r._id || r) === roomId));
                }
            } else {
                throw new Error(data?.message || 'Room details not found in response');
            }
        } catch (error) {
            console.error('Fetch room error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load room details';
            Alert.alert(
                'Fetch Error',
                `URL: ${api.defaults.baseURL}/rooms/${roomId}\n\nError: ${errorMsg}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } finally {
            setLoading(false);
        }
    }, [roomId, navigation, isAuthenticated, user]);

    useEffect(() => {
        fetchRoomDetails();
    }, [fetchRoomDetails]);

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            Alert.alert('Login Required', 'Please login to save rooms.', [
                { text: 'Login', onPress: () => navigation.navigate('Login') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }

        try {
            const { data } = await api.post(`/rooms/${roomId}/favorite`);
            if (data.success) {
                setIsFavorite(data.data.isFavorite);
                // Refresh user data in background to keep global state in sync
                useAuthStore.getState().refreshUser();
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            Alert.alert('Error', 'Failed to update favorite');
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this room: ${room.title} - ₹${room.rent?.amount}/month`,
                url: `https://stayhome.com/rooms/${room._id}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleContact = () => {
        if (!isAuthenticated) {
            Alert.alert('Login Required', 'Please login to contact the owner.', [
                { text: 'Login', onPress: () => navigation.navigate('Login') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }
        navigation.navigate('ChatDetail', {
            recipientId: room.owner._id,
            otherUser: room.owner,
            roomId: room._id
        });
    };

    const [idProof, setIdProof] = useState(null);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                setIdProof(result.assets[0]);
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleScheduleVisit = async () => {
        if (!isAuthenticated || user?.role !== 'student') {
            Alert.alert('Error', 'Only students can schedule visits');
            return;
        }
        if (!dateValue || !timeValue) {
            Alert.alert('Error', 'Please select date and time');
            return;
        }

        if (!idProof) {
            Alert.alert('Required', 'Please upload your ID proof (Aadhar or College ID) to schedule a visit.');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('roomId', room._id);
            formData.append('ownerId', room.owner._id);
            formData.append('requestedDate', dateValue.toISOString().split('T')[0]);
            formData.append('requestedTime', timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
            formData.append('notes', visitNotes);

            // Append file
            formData.append('identityProof', {
                uri: idProof.uri,
                type: idProof.mimeType || 'image/jpeg',
                name: idProof.name || 'id_proof.jpg'
            });

            await api.post('/visits', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Visit request sent! The owner will contact you.');
            setShowVisitModal(false);
            setIdProof(null); // Reset file
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReview = async () => {
        setSubmitting(true);
        try {
            const { data } = await api.post('/reviews', {
                roomId: room._id,
                rating: reviewRating,
                criteria: reviewCriteria,
                comment: reviewComment
            });
            Alert.alert('Success', `Review shared successfully!`);
            fetchRoomDetails();
            setShowReviewModal(false);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReportListing = async () => {
        if (!reportReason) {
            Alert.alert('Error', 'Please select a reason for reporting');
            return;
        }
        if (!reportDescription.trim() || reportDescription.length < 20) {
            Alert.alert('Error', 'Please provide a more detailed description (min 20 chars)');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/rooms/${room._id}/report`, {
                reason: reportReason,
                description: reportDescription
            });
            Alert.alert('Thank You', 'Your report has been submitted and will be reviewed.');
            setShowReportModal(false);
            setReportReason('');
            setReportDescription('');
        } catch (error) {
            console.error('Report error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    const REPORT_REASONS = [
        { label: 'Misleading Location', value: 'misleading_location' },
        { label: 'Privacy/Security Violation', value: 'privacy_violation' },
        { label: 'Unsafe Environment', value: 'unsafe_area' },
        { label: 'Scam or Fraudulent Owner', value: 'scam_fraud' },
        { label: 'Inappropriate Behavior', value: 'inappropriate_behavior' },
        { label: 'Incorrect Amenities/Photos', value: 'incorrect_info' },
        { label: 'Other Issues', value: 'other' }
    ];

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!room) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Advanced Image Gallery */}
                <View style={styles.galleryContainer}>
                    <Animated.ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        onMomentumScrollEnd={(e) => {
                            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                            setSelectedImage(newIndex);
                        }}
                    >
                        {room.images?.map((img, index) => {
                            const inputRange = [
                                (index - 1) * width,
                                index * width,
                                (index + 1) * width
                            ];

                            const scale = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.8, 1, 0.8],
                                extrapolate: 'clamp'
                            });

                            const translateX = scrollX.interpolate({
                                inputRange,
                                outputRange: [width * 0.5, 0, -width * 0.5],
                            });

                            return (
                                <View key={index} style={{ width, height: 450, overflow: 'hidden' }}>
                                    {/* Blurred background for aesthetic consistency if image doesn't fit */}
                                    <Image
                                        source={{ uri: img.url }}
                                        style={[styles.galleryImage, { position: 'absolute', opacity: 0.3 }]}
                                        blurRadius={20}
                                    />
                                    <Animated.Image
                                        source={{ uri: img.url }}
                                        style={[
                                            styles.galleryImage,
                                            {
                                                transform: [{ scale }],
                                                resizeMode: 'cover'
                                            }
                                        ]}
                                    />
                                </View>
                            );
                        })}
                    </Animated.ScrollView>

                    {/* Thumbnail Strip */}
                    <View style={styles.thumbnailContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailScroll}
                        >
                            {(room.images || []).map((img, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        // Scroll main gallery to this image
                                        // Note: Would need a ref for Animated.ScrollView to use scrollTo
                                    }}
                                    style={[
                                        styles.thumbnailItem,
                                        selectedImage === index && styles.thumbnailItemActive
                                    ]}
                                >
                                    <Image source={{ uri: img.url }} style={styles.thumbnailImage} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Gradient Overlays for premium feel */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent']}
                        style={styles.topGradient}
                    />

                    <View style={styles.imageOverlay}>
                        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={3} />
                        </TouchableOpacity>
                        <View style={styles.headerRightBtns}>
                            <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
                                <Share2 size={20} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerBtn}
                                onPress={handleToggleFavorite}
                            >
                                <Heart
                                    size={20}
                                    color={isFavorite ? "#EF4444" : "#FFFFFF"}
                                    fill={isFavorite ? "#EF4444" : "transparent"}
                                    strokeWidth={2.5}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Advanced Dot Pagination */}
                    <View style={styles.dotContainer}>
                        {room.images?.map((_, index) => {
                            const inputRange = [
                                (index - 1) * width,
                                index * width,
                                (index + 1) * width
                            ];

                            const dotWidth = scrollX.interpolate({
                                inputRange,
                                outputRange: [8, 20, 8],
                                extrapolate: 'clamp'
                            });

                            const opacity = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.4, 1, 0.4],
                                extrapolate: 'clamp'
                            });

                            const backgroundColor = scrollX.interpolate({
                                inputRange,
                                outputRange: ['#E5E7EB', '#2563EB', '#E5E7EB'],
                                extrapolate: 'clamp'
                            });

                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        { width: dotWidth, opacity, backgroundColor }
                                    ]}
                                />
                            );
                        })}
                    </View>

                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {selectedImage + 1} / {room.images?.length}
                        </Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    <View style={styles.mainInfo}>
                        <View style={styles.statusRow}>
                            <View style={[styles.badge, styles.verifiedBadge]}>
                                <ShieldCheck size={12} color="#2563EB" />
                                <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                            <View style={[styles.badge, styles.typeBadge, { backgroundColor: '#EDE9FE' }]}>
                                <Text style={[styles.typeText, { color: '#7C3AED' }]}>{room.roomType}</Text>
                            </View>
                            {room.furnishing && (
                                <View style={[styles.badge, { backgroundColor: '#F3F4F6', borderStyle: 'solid', borderWidth: 1, borderColor: '#E5E7EB' }]}>
                                    <Text style={[styles.typeText, { color: '#4B5563' }]}>{room.furnishing.replace('-', ' ')}</Text>
                                </View>
                            )}
                            {room.rent?.electricityBillIncluded && (
                                <View style={[styles.badge, { backgroundColor: '#FEF3C7', borderStyle: 'solid', borderWidth: 1, borderColor: '#FDE68A' }]}>
                                    <Zap size={10} color="#92400E" fill="#92400E" />
                                    <Text style={[styles.typeText, { color: '#92400E', marginLeft: 4 }]}>Elec Inc.</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.title}>{room.title}</Text>

                        <View style={styles.locationRow}>
                            <MapPin size={16} color="#6B7280" />
                            <Text style={styles.locationText}>{room.location?.address?.city}, {room.location?.address?.state}</Text>
                        </View>

                        <View style={styles.priceContainer}>
                            <View>
                                <Text style={styles.priceLabel}>Monthly Rent</Text>
                                <Text style={styles.priceText}>₹{room.rent?.amount}</Text>
                                {room.rent?.electricityBillIncluded && (
                                    <Text style={{ fontSize: 10, color: '#92400E', fontWeight: 'bold', marginTop: 2 }}>Electricity Included</Text>
                                )}
                            </View>
                            <View style={styles.priceDivider} />
                            <View>
                                <Text style={styles.priceLabel}>Deposit</Text>
                                <Text style={styles.priceText}>₹{room.rent?.deposit ?? (room.rent?.amount * 2)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Property Specifications</Text>
                        <View style={styles.specsGrid}>
                            <View style={styles.specItem}>
                                <Layers size={20} color="#2563EB" />
                                <Text style={styles.specLabel}>FURNISHING</Text>
                                <Text style={styles.specValue} numberOfLines={1}>
                                    {room.furnishing?.replace('-', ' ') || 'Unfurnished'}
                                </Text>
                            </View>
                            <View style={styles.specItem}>
                                <Users size={20} color="#2563EB" />
                                <Text style={styles.specLabel}>GENDER</Text>
                                <Text style={styles.specValue} numberOfLines={1}>
                                    {room.genderPreference || 'Any'}
                                </Text>
                            </View>
                            <View style={styles.specItem}>
                                <CheckCircle size={20} color="#2563EB" />
                                <Text style={styles.specLabel}>AVAILABILITY</Text>
                                <Text style={styles.specValue} numberOfLines={1}>
                                    {room.availability?.availableFrom ? new Date(room.availability.availableFrom).toLocaleDateString('en-GB') : 'Now'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Highlights</Text>
                        <View style={styles.highlightsGrid}>
                            <View style={styles.highlightItem}>
                                <Zap size={20} color="#2563EB" />
                                <Text style={styles.highlightLabel}>Instant Approval</Text>
                            </View>
                            <View style={styles.highlightItem}>
                                <Users size={20} color="#2563EB" />
                                <Text style={styles.highlightLabel}>{room.roomType} Room</Text>
                            </View>
                            <View style={styles.highlightItem}>
                                <Star size={20} color="#2563EB" />
                                <Text style={styles.highlightLabel}>{room.rating?.average ? room.rating.average.toFixed(1) : 'New'} Rating</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{room.description}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Amenities</Text>
                        <View style={styles.amenitiesList}>
                            {(room.amenities || []).map((amenity, index) => {
                                const amenityKey = amenity?.toLowerCase()?.replace(' ', '_');
                                const IconComponent = AMENITY_ICONS[amenityKey] || CheckCircle;

                                return (
                                    <View key={index} style={styles.amenityItem}>
                                        <View style={styles.amenityIconBox}>
                                            <IconComponent size={14} color="#2563EB" />
                                        </View>
                                        <Text style={styles.amenityText}>{amenity?.replace('_', ' ')}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nearby Landmarks</Text>
                        <View style={styles.landmarksGrid}>
                            {landmarksLoading ? (
                                <ActivityIndicator color="#2563EB" />
                            ) : landmarks.length > 0 ? (
                                landmarks.map((landmark, idx) => (
                                    <View key={idx} style={styles.landmarkItem}>
                                        <View style={styles.landmarkIconBox}>
                                            {landmark.type?.includes('university') || landmark.type?.includes('college') ? <School size={18} color="#2563EB" /> :
                                                landmark.type?.includes('hospital') || landmark.type?.includes('clinic') ? <Activity size={18} color="#2563EB" /> :
                                                    landmark.type?.includes('bus') ? <Bus size={18} color="#2563EB" /> : <Train size={18} color="#2563EB" />}
                                        </View>
                                        <View style={styles.landmarkTexts}>
                                            <Text style={styles.landmarkName} numberOfLines={1}>{landmark.name}</Text>
                                            <Text style={styles.landmarkDist}>{formatDistance(landmark.distance)} away</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No major landmarks nearby</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.whyBookCard}>
                            <Text style={styles.whyBookTitle}>Why book this property?</Text>
                            <View style={styles.whyBookItem}>
                                <View style={styles.whyBookIconBox}>
                                    <ShieldCheck size={20} color="#60A5FA" />
                                </View>
                                <View>
                                    <Text style={styles.whyBookLabel}>Verified Owner</Text>
                                    <Text style={styles.whyBookSub}>Identity & Property Confirmed</Text>
                                </View>
                            </View>
                            <View style={styles.whyBookItem}>
                                <View style={styles.whyBookIconBox}>
                                    <Zap size={20} color="#34D399" />
                                </View>
                                <View>
                                    <Text style={styles.whyBookLabel}>Instant Approval</Text>
                                    <Text style={styles.whyBookSub}>Responses within 2 hours</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.ownerSection}>
                        <Image
                            source={{ uri: room.owner?.avatar?.url || `https://ui-avatars.com/api/?name=${room.owner?.name}` }}
                            style={styles.ownerAvatar}
                        />
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerName}>Hosted by {room.owner?.name}</Text>
                            <Text style={styles.ownerStatus}>Verified Identity</Text>
                        </View>
                        <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
                            <MessageSquare size={20} color="#2563EB" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <RoomMapView room={room} height={350} />
                    </View>

                    {/* Reviews Section */}
                    <View style={[styles.section, { marginTop: 32 }]}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Student Reviews</Text>
                                <View style={styles.reviewSummaryHeader}>
                                    <View style={styles.avgRatingBadge}>
                                        <Star size={12} fill="#F59E0B" color="#F59E0B" />
                                        <Text style={styles.avgRatingText}>{room.rating?.average ? room.rating.average.toFixed(1) : '0.0'}</Text>
                                    </View>
                                    <Text style={styles.reviewCountText}>{reviews.length} Verified Reviews</Text>
                                </View>
                            </View>
                            {isAuthenticated && (
                                <TouchableOpacity onPress={() => setShowReviewModal(true)}>
                                    <Text style={styles.actionLink}>{hasReviewed ? 'Edit My Review' : 'Write Review'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Criteria Bars */}
                        {reviews.length > 0 && (
                            <View style={styles.criteriaContainer}>
                                {['cleanliness', 'accuracy', 'communication', 'location', 'value'].map(c => (
                                    <View key={c} style={styles.criteriaItem}>
                                        <Text style={styles.criteriaLabel}>{c}</Text>
                                        <View style={styles.criteriaBarBg}>
                                            <View
                                                style={[
                                                    styles.criteriaBarFill,
                                                    { width: `${(room.rating?.average || 4.5) * 20}%` }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.criteriaValue}>{room.rating?.average?.toFixed(1) || '4.5'}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {reviews.length > 0 ? (
                            reviews.map((review, i) => (
                                <View key={i} style={styles.reviewCard}>
                                    <View style={styles.reviewCardHeader}>
                                        <View style={styles.reviewerInfo}>
                                            <View style={styles.reviewerAvatar}>
                                                <Text style={styles.reviewerInitial}>{review.student?.name?.[0]}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.reviewerName}>{review.student?.name}</Text>
                                                <View style={styles.reviewStars}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star size={10} key={s} fill={s <= review.rating ? "#F59E0B" : "transparent"} color={s <= reviewRating ? "#F59E0B" : "#D1D5DB"} />
                                                    ))}
                                                    <Text style={styles.reviewDate}> • {new Date(review.createdAt).toLocaleDateString()}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.verifiedStayBadge}>
                                            <ShieldCheck size={10} color="#059669" />
                                            <Text style={styles.verifiedStayText}>Verified Stay</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.reviewCommentText}>"{review.comment}"</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyActivity}>
                                <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>
                            </View>
                        )}
                    </View>

                    {/* Danger Zone */}
                    <TouchableOpacity
                        style={styles.reportBtn}
                        onPress={() => setShowReportModal(true)}
                    >
                        <Info size={16} color="#EF4444" />
                        <Text style={styles.reportText}>Report this listing</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Sticky Bottom Actions */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.footerPrice}>₹{room.rent?.amount}</Text>
                    <Text style={styles.footerLabel}>Total / month</Text>
                </View>
                <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => setShowVisitModal(true)}
                >
                    <Text style={styles.bookBtnText}>Schedule Visit</Text>
                </TouchableOpacity>
            </View>

            {/* Visit Request Modal */}
            <Modal visible={showVisitModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Request Visit</Text>
                                <TouchableOpacity onPress={() => setShowVisitModal(false)}>
                                    <X size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.modalScrollContent}
                            >
                                <Text style={styles.inputLabel}>Requested Date *</Text>
                                <TouchableOpacity
                                    style={styles.pickerTrigger}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Calendar size={18} color="#6B7280" />
                                    <Text style={styles.pickerText}>{dateValue.toLocaleDateString()}</Text>
                                </TouchableOpacity>

                                <Text style={styles.inputLabel}>Requested Time *</Text>
                                <TouchableOpacity
                                    style={styles.pickerTrigger}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Clock size={18} color="#6B7280" />
                                    <Text style={styles.pickerText}>
                                        {timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : null}>
                                        <DateTimePicker
                                            value={dateValue}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                if (Platform.OS === 'android') setShowDatePicker(false);
                                                if (selectedDate) setDateValue(selectedDate);
                                            }}
                                            minimumDate={new Date()}
                                            themeVariant="dark"
                                            textColor="#000000"
                                            accentColor="#2563EB"
                                        />
                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                style={styles.pickerDoneBtn}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <Text style={styles.pickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {showTimePicker && (
                                    <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : null}>
                                        <DateTimePicker
                                            value={timeValue}
                                            mode="time"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedTime) => {
                                                if (Platform.OS === 'android') setShowTimePicker(false);
                                                if (selectedTime) setTimeValue(selectedTime);
                                            }}
                                            themeVariant="dark"
                                            textColor="#000000"
                                            accentColor="#2563EB"
                                        />
                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                style={styles.pickerDoneBtn}
                                                onPress={() => setShowTimePicker(false)}
                                            >
                                                <Text style={styles.pickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                <Text style={styles.inputLabel}>Identity Proof (Aadhar/College ID) *</Text>
                                <TouchableOpacity
                                    style={styles.uploadBox}
                                    onPress={handlePickDocument}
                                >
                                    {idProof ? (
                                        <View style={styles.uploadedFile}>
                                            <ShieldCheck size={24} color="#059669" />
                                            <Text style={styles.uploadedFileName} numberOfLines={1}>
                                                {idProof.name}
                                            </Text>
                                            <TouchableOpacity onPress={() => setIdProof(null)} style={{ marginLeft: 'auto' }}>
                                                <X size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <>
                                            <Upload size={24} color="#6B7280" />
                                            <Text style={styles.uploadText}>Tap to upload ID Proof</Text>
                                            <Text style={styles.uploadSubText}>Required for owner verification</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                                    placeholder="Any questions for the owner?"
                                    multiline
                                    value={visitNotes}
                                    onChangeText={setVisitNotes}
                                />

                                <Button
                                    title="Send Request"
                                    onPress={handleScheduleVisit}
                                    loading={submitting}
                                    style={{ marginTop: 24 }}
                                />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Review Modal */}
            <Modal visible={showReviewModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{hasReviewed ? 'Edit Review' : 'Write Review'}</Text>
                                <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                                    <X size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.modalScrollContent}
                            >
                                <Text style={styles.inputLabel}>Overall Rating</Text>
                                <View style={styles.ratingSelector}>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <TouchableOpacity key={num} onPress={() => setReviewRating(num)}>
                                            <Star
                                                size={32}
                                                color={num <= reviewRating ? "#F59E0B" : "#D1D5DB"}
                                                fill={num <= reviewRating ? "#F59E0B" : "transparent"}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.inputLabel}>Detailed Feedback</Text>
                                <View style={styles.criteriaSelectorGrid}>
                                    {Object.keys(reviewCriteria).map(key => (
                                        <View key={key} style={styles.criteriaSelectorItem}>
                                            <Text style={styles.criteriaSelectLabel}>{key}</Text>
                                            <View style={styles.criteriaStars}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <TouchableOpacity
                                                        key={s}
                                                        onPress={() => setReviewCriteria(prev => ({ ...prev, [key]: s }))}
                                                    >
                                                        <Star
                                                            size={18}
                                                            color={s <= reviewCriteria[key] ? "#2563EB" : "#D1D5DB"}
                                                            fill={s <= reviewCriteria[key] ? "#2563EB" : "transparent"}
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <Text style={[styles.inputLabel, { marginTop: 24 }]}>Your Comment</Text>
                                <TextInput
                                    style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                                    placeholder="How was your experience with this room?"
                                    multiline
                                    value={reviewComment}
                                    onChangeText={setReviewComment}
                                />
                                <Button
                                    title={hasReviewed ? "Update Review" : "Submit Review"}
                                    onPress={handleSubmitReview}
                                    loading={submitting}
                                    style={{ marginTop: 24 }}
                                />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal >

            {/* Report Modal */}
            < Modal visible={showReportModal} transparent animationType="slide" >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Report Listing</Text>
                                <TouchableOpacity onPress={() => {
                                    setShowReportModal(false);
                                    setReportReason('');
                                    setReportDescription('');
                                }}>
                                    <X size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.inputLabel}>Reason for Reporting</Text>
                                <View style={styles.reasonGrid}>
                                    {REPORT_REASONS.map((r) => (
                                        <TouchableOpacity
                                            key={r.value}
                                            style={[
                                                styles.reasonChip,
                                                reportReason === r.value && styles.reasonChipActive
                                            ]}
                                            onPress={() => setReportReason(r.value)}
                                        >
                                            <Text style={[
                                                styles.reasonChipText,
                                                reportReason === r.value && styles.reasonChipTextActive
                                            ]}>{r.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                                    <Text style={styles.inputLabel}>Description</Text>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: reportDescription.length < 20 ? '#EF4444' : '#10B981' }}>
                                        {reportDescription.length}/1000
                                    </Text>
                                </View>
                                <TextInput
                                    style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                                    placeholder="Please provide specific details to help our investigation (min 20 characters)..."
                                    multiline
                                    value={reportDescription}
                                    onChangeText={setReportDescription}
                                />
                                <Button
                                    variant="danger"
                                    title="Submit Report"
                                    onPress={handleReportListing}
                                    loading={submitting}
                                    disabled={!reportReason || reportDescription.length < 20}
                                    style={{ marginTop: 24 }}
                                />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    galleryContainer: {
        height: 450,
        backgroundColor: '#000',
        position: 'relative',
    },
    galleryImage: {
        width: width,
        height: 450,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        zIndex: 1,
    },
    imageOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 34,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerRightBtns: {
        flexDirection: 'row',
        gap: 12,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dotContainer: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        zIndex: 5,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 36,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 5,
    },
    imageCounterText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    thumbnailContainer: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 5,
    },
    thumbnailScroll: {
        paddingHorizontal: 20,
        gap: 8,
        alignItems: 'center',
    },
    thumbnailItem: {
        width: 50,
        height: 50,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        opacity: 0.6,
    },
    thumbnailItemActive: {
        borderColor: '#FFFFFF',
        opacity: 1,
        transform: [{ scale: 1.1 }],
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
    },
    mainInfo: {
        marginBottom: 32,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    verifiedBadge: {
        backgroundColor: '#EFF6FF',
    },
    verifiedText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    typeBadge: {
        backgroundColor: '#F3F4F6',
    },
    typeText: {
        color: '#4B5563',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    locationText: {
        fontSize: 15,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    priceContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    priceText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    priceDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionLink: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 14,
    },
    highlightsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    highlightItem: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginRight: 8,
    },
    highlightLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4B5563',
        marginTop: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    amenitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 12,
    },
    amenityIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    amenityText: {
        fontSize: 14,
        color: '#4B5563',
        textTransform: 'capitalize',
    },
    ownerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        marginBottom: 20,
    },
    ownerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    ownerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    ownerStatus: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
        marginTop: 2,
    },
    contactBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    landmarksGrid: {
        gap: 12,
    },
    landmarkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 16,
    },
    landmarkIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    landmarkTexts: {
        marginLeft: 12,
    },
    landmarkName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#111827',
    },
    landmarkDist: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    specsGrid: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        justifyContent: 'space-between',
    },
    specItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    specLabel: {
        fontSize: 9,
        color: '#64748B',
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
    specValue: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: 'bold',
        marginTop: 4,
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    locationSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    mapActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: 16,
    },
    map: {
        flex: 1,
    },
    reviewSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    avgRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    avgRatingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D97706',
    },
    reviewCountText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    criteriaContainer: {
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        gap: 12,
    },
    criteriaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    criteriaLabel: {
        width: 100,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    criteriaBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    criteriaBarFill: {
        height: '100%',
        backgroundColor: '#2563EB',
    },
    criteriaValue: {
        width: 24,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    reviewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerInitial: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    reviewStars: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    reviewCommentText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    verifiedStayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    verifiedStayText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#059669',
        textTransform: 'uppercase',
    },
    criteriaSelectorGrid: {
        gap: 16,
        marginTop: 16,
    },
    criteriaSelectorItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 16,
    },
    criteriaSelectLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B5563',
        textTransform: 'uppercase',
    },
    criteriaStars: {
        flexDirection: 'row',
        gap: 8,
    },
    whyBookCard: {
        backgroundColor: '#1E3A8A',
        borderRadius: 24,
        padding: 24,
    },
    whyBookTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    whyBookItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    whyBookIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    whyBookLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    whyBookSub: {
        fontSize: 11,
        color: '#BFDBFE',
        marginTop: 2,
    },
    securityGrid: {
        gap: 16,
    },
    securityItem: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    securityLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    securityDesc: {
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 16,
    },
    safetyCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'flex-start',
    },
    safetyText: {
        flex: 1,
        fontSize: 12,
        color: '#1E40AF',
        marginLeft: 12,
        lineHeight: 18,
        fontWeight: '500',
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewUser: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D97706',
    },
    reviewComment: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    reviewDate: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 12,
    },
    emptyActivity: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    reportText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    footerInfo: {
        flex: 1,
    },
    footerPrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    footerLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    bookBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    bookBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalBody: {
        flex: 1,
    },
    modalScrollContent: {
        padding: 24,
        paddingBottom: 60, // Extra space at bottom to prevent button clipping
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#111827',
    },
    ratingSelector: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 8,
    },
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        gap: 12,
        marginTop: 8,
    },
    pickerText: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    iosPickerContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginVertical: 8,
        padding: 8,
    },
    pickerDoneBtn: {
        alignItems: 'center',
        padding: 8,
    },
    pickerDoneText: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 16,
    },
    uploadBox: {
        height: 120,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B5563',
        marginTop: 8,
    },
    uploadSubText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    uploadedFile: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        gap: 12,
    },
    uploadedFileName: {
        flex: 1,
        fontSize: 14,
        color: '#065F46',
        fontWeight: '500',
    },
    pickerDoneBtn: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 8,
    },
    pickerDoneText: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 16,
    },
    reasonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    reasonChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    reasonChipActive: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
    },
    reasonChipText: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '600',
    },
    reasonChipTextActive: {
        color: '#EF4444',
    }
});

export default RoomDetailsScreen;
