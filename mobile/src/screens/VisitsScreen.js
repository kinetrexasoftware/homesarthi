import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Linking,
    Platform
} from 'react-native';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, ChevronRight, Navigation, LocateFixed, Key } from 'lucide-react-native';
import * as Location from 'expo-location';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { getSocket } from '../services/socket';

const haversineDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return null;

    // Ensure coordinates are numbers
    const lat1 = Number(coords1.latitude);
    const lon1 = Number(coords1.longitude);

    // Handle MondoDB GeoJSON [lng, lat] vs typical {latitude, longitude}
    // Checking if coords2 is array [lng, lat] or object
    let lat2, lon2;
    if (Array.isArray(coords2)) {
        lon2 = Number(coords2[0]);
        lat2 = Number(coords2[1]);
    } else {
        lat2 = Number(coords2.latitude || coords2.lat);
        lon2 = Number(coords2.longitude || coords2.lng || coords2.lon);
    }

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;

    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

const VisitsScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [responseModalVisible, setResponseModalVisible] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState(null);

    const fetchVisits = useCallback(async () => {
        try {
            let endpoint = user?.role === 'student' ? '/visits/my-visits' : '/visits/owner-visits';
            const { data } = await api.get(endpoint);
            if (data?.success) {
                setVisits(data.data.visits || []);
            }
        } catch (error) {
            console.error('Fetch visits error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.role]);

    const [gpsError, setGpsError] = useState(null);
    const [checkingLocation, setCheckingLocation] = useState(false);

    const checkLocation = async () => {
        setCheckingLocation(true);
        setGpsError(null);
        try {
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                setGpsError("GPS is disabled");
                setCheckingLocation(false);
                return;
            }

            let { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const req = await Location.requestForegroundPermissionsAsync();
                status = req.status;
            }

            setLocationPermission(status);

            if (status === 'granted') {
                // Try last known position first for speed
                const lastKnown = await Location.getLastKnownPositionAsync({});
                if (lastKnown) setCurrentLocation(lastKnown.coords);

                // Then get fresh high-accuracy position
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000
                });
                setCurrentLocation(loc.coords);
            } else {
                setGpsError("Permission denied");
            }
        } catch (error) {
            console.log("Generic Location Error:", error);
            setGpsError("Failed to get location");
        } finally {
            setCheckingLocation(false);
        }
    };



    useEffect(() => {
        fetchVisits();
        checkLocation();

        // Socket listener for real-time updates
        let socket;
        const subscribeToUpdates = async () => {
            try {
                socket = await getSocket();
                if (socket) {
                    socket.on('new_notification', (data) => {
                        if (data.category === 'visits') {
                            console.log('⚡ VisitsScreen: New visit update received, refreshing...');
                            fetchVisits();
                        }
                    });
                }
            } catch (err) {
                console.warn('Socket subscription failed in VisitsScreen', err);
            }
        };

        subscribeToUpdates();

        return () => {
            if (socket) {
                socket.off('new_notification');
            }
        };
    }, [fetchVisits]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchVisits();
        checkLocation();
    };

    const handleAction = async (visitId, action, payload = {}) => {
        try {
            let endpoint = `/visits/${visitId}/${action}`;
            // Simplify endpoints mapping if needed, but we added specific ones
            if (action === 'mark-visited') endpoint = `/visits/${visitId}/mark-visited`;
            if (action === 'mark-rented') endpoint = `/visits/${visitId}/mark-rented`;

            // For approve/reject, keep existing logic or map
            if (action === 'approve' || action === 'reject') {
                endpoint = `/visits/${visitId}/${action}`;
            }

            const { data } = await api.put(endpoint, payload);
            if (data.success) {
                const successMessage = data.data?.message || data.message || 'Status updated successfully';
                Alert.alert('Success', successMessage);
                setResponseModalVisible(false);
                setResponseMessage('');
                fetchVisits();
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Action failed');
        }
    };

    const filteredVisits = visits.filter(v => filter === 'all' || v.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return { bg: '#FEF3C7', text: '#92400E' };
            case 'approved': return { bg: '#DCFCE7', text: '#166534' };
            case 'rejected': return { bg: '#FEE2E2', text: '#991B1B' };
            case 'completed': return { bg: '#EFF6FF', text: '#1E40AF' };
            case 'visited': return { bg: '#DBEAFE', text: '#1E3A8A' };
            case 'rented': return { bg: '#ECFDF5', text: '#064E3B' };
            default: return { bg: '#F3F4F6', text: '#4B5563' };
        }
    };

    const renderVisitItem = ({ item }) => {
        const status = getStatusColor(item.status);
        const isOwner = user?.role === 'owner';
        const otherParty = isOwner ? item.student : item.owner;
        const isApproved = item.status === 'approved';

        // Location Logic
        let distance = null;
        let isNearby = false;

        const roomCoords = item.room?.location?.exactLocation?.coordinates || item.room?.location?.coordinates;

        if (!isOwner && isApproved && currentLocation && roomCoords) {
            distance = haversineDistance(currentLocation, roomCoords);
            if (distance !== null && distance < 500) { // 500 meters threshold
                isNearby = true;
            }
        }

        return (
            <View style={styles.visitCard}>
                <View style={styles.cardHeader}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('RoomDetails', { roomId: item.room?._id })}
                        style={styles.roomThumbContainer}
                    >
                        <Image
                            source={{ uri: item.room?.images?.[0]?.url || 'https://via.placeholder.com/100' }}
                            style={styles.roomThumb}
                        />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.roomTitle} numberOfLines={1}>{item.room?.title}</Text>
                        <View style={styles.locationContainer}>
                            <MapPin size={10} color="#6B7280" />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {isApproved || isOwner ? (item.room?.location?.address?.city || 'Address available') : 'Location hidden until approval'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                {/* --- Action Area for Approved Visits --- */}
                {!isOwner && isApproved && (
                    <View style={styles.checkInArea}>
                        {isNearby ? (
                            <View style={styles.nearbyAlert}>
                                <LocateFixed size={16} color="#059669" />
                                <Text style={styles.nearbyText}>You are at the location!</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.checkInBtn,
                                isNearby ? styles.checkInBtnActive : styles.checkInBtnManual
                            ]}
                            onPress={() => {
                                Alert.alert(
                                    "Confirm Visit",
                                    isNearby ? "GPS confirms you are at the location. Mark as visited?" : "Are you sure you have visited the property?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Yes, I Visited", onPress: () => handleAction(item._id, 'mark-visited', { verificationMethod: isNearby ? 'gps' : 'manual' }) }
                                    ]
                                );
                            }}
                        >
                            <CheckCircle size={18} color="#FFF" />
                            <Text style={styles.checkInBtnText}>
                                {isNearby ? "Smart Check-in (GPS Verified)" : "Mark as Visited"}
                            </Text>
                        </TouchableOpacity>

                        {!isNearby && (
                            <View style={styles.gpsStatusContainer}>
                                {checkingLocation ? (
                                    <Text style={styles.manualNote}>📍 Refreshing GPS...</Text>
                                ) : gpsError ? (
                                    <TouchableOpacity onPress={checkLocation} style={styles.retryBtn}>
                                        <Text style={styles.retryText}>⚠️ {gpsError} - Retry</Text>
                                    </TouchableOpacity>
                                ) : currentLocation ? (
                                    <View style={styles.distanceInfo}>
                                        <Text style={styles.manualNote}>
                                            {distance !== null
                                                ? `You are ${(distance / 1000).toFixed(2)}km away`
                                                : (!roomCoords ? "Property location not set" : "Waiting for user location...")}
                                        </Text>
                                        <TouchableOpacity onPress={checkLocation}>
                                            <Navigation size={14} color="#2563EB" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity onPress={checkLocation}>
                                        <Text style={styles.manualNote}>📍 Tap to fetch location</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* --- Owner Actions for Visited/Completed --- */}
                {isOwner && (item.status === 'visited' || item.status === 'completed') && (
                    <View style={styles.checkInArea}>
                        <View style={styles.nearbyAlert}>
                            <CheckCircle size={16} color="#059669" />
                            <Text style={styles.nearbyText}>Student has visited.</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.rentedBtn}
                            onPress={() => {
                                Alert.alert(
                                    "Mark as Rented",
                                    "Did this student rent the room? This will update analytics.",
                                    [
                                        { text: "No", style: "cancel" },
                                        { text: "Yes, Rented", onPress: () => handleAction(item._id, 'mark-rented') }
                                    ]
                                );
                            }}
                        >
                            <Key size={18} color="#FFF" />
                            <Text style={styles.rentedBtnText}>Mark as Rented to {item.student?.name}</Text>
                        </TouchableOpacity>
                    </View>
                )}


                <View style={styles.cardBody}>
                    <View style={styles.partyRow}>
                        <View style={styles.partyIcon}>
                            <Text style={styles.partyIconText}>{otherParty?.name?.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={styles.partyLabel}>{isOwner ? 'Requested by' : 'Owner'}</Text>
                            <Text style={styles.partyName}>{otherParty?.name}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Calendar size={14} color="#6B7280" />
                            <Text style={styles.infoText}>{new Date(item.requestedDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Clock size={14} color="#6B7280" />
                            <Text style={styles.infoText}>{item.requestedTime}</Text>
                        </View>
                    </View>

                    {item.notes && (
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesLabel}>Request Note:</Text>
                            <Text style={styles.notesText}>{item.notes}</Text>
                        </View>
                    )}

                    {/* ID Proof Display for Owner */}
                    {(isOwner && item.identityProof) && (
                        <View style={styles.idProofContainer}>
                            <Text style={styles.notesLabel}>Identity Proof:</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Linking.openURL(item.identityProof);
                                }}
                                style={styles.idProofPreview}
                            >
                                <Image
                                    source={{ uri: item.identityProof }}
                                    style={styles.idProofImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.viewIdBadge}>
                                    <Text style={styles.viewIdText}>View ID</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.ownerResponse && (
                        <View style={styles.responseBox}>
                            <Text style={styles.responseLabel}>Owner's Response:</Text>
                            <Text style={styles.responseText}>{item.ownerResponse}</Text>
                        </View>
                    )}

                    {/* Contact Number - Visible for approved visits or to owner */}
                    {(isApproved || isOwner) && item.room?.contactNumber && (
                        <View style={styles.contactBox}>
                            <Text style={styles.contactLabel}>📞 Contact Number</Text>
                            <Text style={styles.contactNumber}>{item.room.contactNumber}</Text>
                            {!isOwner && (
                                <Text style={styles.contactNote}>✓ Available after approval</Text>
                            )}
                        </View>
                    )}

                    {/* Exact Location & Address */}
                    {(isOwner || isApproved || (item.room?.location?.exactLocation && item.room?.location?.locationVisibility === 'exact')) && (
                        <View style={styles.exactLocationBox}>
                            <Text style={styles.exactLocationLabel}>📍 Exact Property Location</Text>

                            {/* Full Address Display */}
                            {item.room?.location?.address && (
                                <View style={styles.addressContainer}>
                                    <Text style={styles.fullAddressText}>
                                        {item.room.location.address.street ? `${item.room.location.address.street}, ` : ''}
                                        {item.room.location.address.city}, {item.room.location.address.state}
                                        {item.room.location.address.zipCode ? ` - ${item.room.location.address.zipCode}` : ''}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.openMapBtn}
                                onPress={() => {
                                    const lat = item.room?.location?.exactLocation?.coordinates?.[1] || item.room?.location?.coordinates?.[1];
                                    const lng = item.room?.location?.exactLocation?.coordinates?.[0] || item.room?.location?.coordinates?.[0];

                                    if (!lat || !lng) {
                                        Alert.alert('Error', 'Location coordinates not available');
                                        return;
                                    }

                                    const url = Platform.OS === 'ios'
                                        ? `maps://app?daddr=${lat},${lng}`
                                        : `google.navigation:q=${lat},${lng}`;

                                    Linking.openURL(url).catch(() => {
                                        const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                                        Linking.openURL(browserUrl);
                                    });
                                }}
                            >
                                <Navigation size={18} color="#FFFFFF" />
                                <Text style={styles.openMapText}>Get Directions</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {isOwner && item.status === 'pending' && (
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.approveBtn]}
                            onPress={() => {
                                setSelectedVisit(item);
                                setResponseModalVisible(true);
                            }}
                        >
                            <CheckCircle size={16} color="#FFFFFF" />
                            <Text style={styles.approveBtnText}>Review Request</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Visits</Text>
            </View>

            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['all', 'pending', 'approved', 'visited', 'rented', 'rejected'].map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.filterChipActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={filteredVisits}
                    renderItem={renderVisitItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No visit requests found.</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={responseModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Respond to Request</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter message (optional for approval, required for rejection)"
                            multiline
                            numberOfLines={4}
                            value={responseMessage}
                            onChangeText={setResponseMessage}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalCancelBtn]}
                                onPress={() => setResponseModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalRejectBtn]}
                                onPress={() => handleAction(selectedVisit._id, 'reject', { responseMessage })}
                            >
                                <Text style={styles.modalRejectText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalApproveBtn]}
                                onPress={() => handleAction(selectedVisit._id, 'approve', { responseMessage })}
                            >
                                <Text style={styles.modalApproveText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    filterBar: {
        marginVertical: 10,
        paddingLeft: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    visitCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    roomThumbContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    roomThumb: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'uppercase',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    locationText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
    },
    cardBody: {
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB',
    },
    partyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    partyIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    partyIconText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#2563EB',
    },
    partyLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    partyName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    infoDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#E5E7EB',
    },
    infoText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
        marginLeft: 8,
    },
    notesContainer: {
        marginBottom: 12,
    },
    notesLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    responseBox: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    responseLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    responseText: {
        fontSize: 13,
        color: '#111827',
        lineHeight: 18,
    },
    cardActions: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    approveBtn: {
        backgroundColor: '#2563EB',
    },
    approveBtnText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    completeBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    completeBtnText: {
        color: '#2563EB',
        fontWeight: '900',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        textTransform: 'uppercase',
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        height: 120,
        textAlignVertical: 'top',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelBtn: {
        backgroundColor: '#F3F4F6',
    },
    modalCancelText: {
        color: '#6B7280',
        fontWeight: '900',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    modalRejectBtn: {
        backgroundColor: '#FEE2E2',
    },
    modalRejectText: {
        color: '#DC2626',
        fontWeight: '900',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    modalApproveBtn: {
        backgroundColor: '#2563EB',
    },
    modalApproveText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    checkInArea: {
        marginTop: 12,
        marginBottom: 8,
    },
    nearbyAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8,
    },
    nearbyText: {
        color: '#047857',
        fontSize: 12,
        fontWeight: '700',
    },
    checkInBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    checkInBtnActive: {
        backgroundColor: '#059669', // Green for GPS verified
    },
    checkInBtnManual: {
        backgroundColor: '#3B82F6', // Blue for Manual
    },
    checkInBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 13,
        textTransform: 'uppercase',
    },
    manualNote: {
        textAlign: 'center',
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 6,
    },
    rentedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#7C3AED',
        gap: 8,
    },
    rentedBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 13,
        textTransform: 'uppercase',
    },
    contactBox: {
        backgroundColor: '#ECFDF5',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginTop: 12,
    },
    contactLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#065F46',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    contactNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#047857',
        letterSpacing: 1,
    },
    contactNote: {
        fontSize: 10,
        color: '#059669',
        marginTop: 4,
        fontWeight: '600',
    },
    exactLocationBox: {
        backgroundColor: '#EFF6FF',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginTop: 12,
    },
    exactLocationLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#1E40AF',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    addressContainer: {
        marginBottom: 8,
    },
    fullAddressText: {
        fontSize: 13,
        color: '#1E40AF',
        fontWeight: '600',
        lineHeight: 18,
    },
    openMapBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    openMapText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    idProofContainer: {
        marginTop: 12,
        marginBottom: 12,
    },
    idProofPreview: {
        marginTop: 8,
        width: 120,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    idProofImage: {
        width: '100%',
        height: '100%',
    },
    viewIdBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 4,
        alignItems: 'center',
    },
    viewIdText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    gpsStatusContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    retryBtn: {
        padding: 4,
    },
    retryText: {
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '600',
    },
    distanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
});

export default VisitsScreen;
