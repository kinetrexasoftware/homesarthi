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
    ShieldCheck,
    MapPin,
    CheckCircle,
    XCircle,
    ChevronRight,
    Home,
    ImageIcon,
    ShieldAlert,
    Zap,
    Info,
    Eye,
    Search,
    Filter
} from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '../services/api';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const { width } = Dimensions.get('window');

const AdminRoomsScreen = ({ navigation, route }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState(route.params?.filter || 'pending'); // 'pending', 'approved', 'rejected'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchRooms = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'pending' ? '/admin/rooms/pending' : `/admin/rooms?status=${filter}&search=${searchQuery}`;
            const response = await api.get(endpoint);
            setRooms(response.data.data.rooms || []);
        } catch (error) {
            console.error('Fetch rooms error:', error);
            Alert.alert('Error', 'Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleAction = async (action) => {
        if (!selectedRoom) return;

        if (action === 'reject' && !rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            const endpoint = `/admin/rooms/${selectedRoom._id}/${action}`;
            await api.put(endpoint, action === 'reject' ? { reason: rejectionReason } : {});

            Alert.alert('Success', `Room listing ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            setRooms(prev => prev.filter(r => r._id !== selectedRoom._id));
            setSelectedRoom(null);
            setRejectionReason('');
        } catch (error) {
            console.error(`Room ${action} error:`, error);
            Alert.alert('Error', error.response?.data?.message || `Failed to ${action} room`);
        } finally {
            setActionLoading(false);
        }
    };

    const renderRoomItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.roomCard, selectedRoom?._id === item._id && styles.selectedCard]}
            onPress={() => setSelectedRoom(item)}
        >
            <Image
                source={{ uri: item.images?.[0]?.url }}
                style={styles.roomThumb}
            />
            <View style={styles.roomInfo}>
                <Text style={styles.roomTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.roomLocation}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.locationText}>{item.location?.address?.city}</Text>
                </View>
                <View style={styles.roomMeta}>
                    <Text style={styles.priceText}>₹{item.rent?.amount.toLocaleString()}</Text>
                    <Text style={styles.typeTag}>{item.roomType}</Text>
                </View>
            </View>
            <ChevronRight size={20} color="#D1D5DB" />
        </TouchableOpacity>
    );

    if (loading) return <Loader />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Room Governance</Text>
                    <Text style={styles.headerSubtitle}>{rooms.length} Listings Found</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.filterContainer}>
                {['pending', 'approved', 'rejected'].map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.activeFilter]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                            {f.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search rooms, owners or locations..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            <View style={styles.content}>
                <FlatList
                    data={rooms}
                    renderItem={renderRoomItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <ShieldCheck size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>All listings are reviewed!</Text>
                        </View>
                    }
                />
            </View>

            {/* Verification Modal */}
            <Modal
                visible={!!selectedRoom}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setSelectedRoom(null)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setSelectedRoom(null)} style={styles.modalCloseBtn}>
                            <XCircle size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>Verification Suite</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {selectedRoom && (
                            <>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Visual Proofs</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                        {selectedRoom.images.map((img, i) => (
                                            <Image key={i} source={{ uri: img.url }} style={styles.detailImage} />
                                        ))}
                                    </ScrollView>
                                </View>

                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Geospatial Vetting</Text>
                                        <View style={styles.exactBadge}>
                                            <Zap size={10} color="#2563EB" />
                                            <Text style={styles.exactText}>Exact Location</Text>
                                        </View>
                                    </View>
                                    <View style={styles.mapContainer}>
                                        <MapView
                                            provider={PROVIDER_GOOGLE}
                                            style={styles.map}
                                            initialRegion={{
                                                latitude: selectedRoom.location?.coordinates?.[1] || 26.8467,
                                                longitude: selectedRoom.location?.coordinates?.[0] || 80.9462,
                                                latitudeDelta: 0.01,
                                                longitudeDelta: 0.01,
                                            }}
                                        >
                                            <Marker
                                                coordinate={{
                                                    latitude: selectedRoom.location?.coordinates?.[1] || 26.8467,
                                                    longitude: selectedRoom.location?.coordinates?.[0] || 80.9462,
                                                }}
                                            />
                                        </MapView>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Listing Context</Text>
                                    <View style={styles.detailsCard}>
                                        <Text style={styles.detailTitle}>{selectedRoom.title}</Text>
                                        <Text style={styles.detailDesc}>{selectedRoom.description}</Text>

                                        <View style={styles.statsRow}>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statLabel}>Rent</Text>
                                                <Text style={styles.statValue}>₹{selectedRoom.rent?.amount.toLocaleString()}</Text>
                                            </View>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statLabel}>Type</Text>
                                                <Text style={styles.statValue}>{selectedRoom.roomType}</Text>
                                            </View>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statLabel}>Gender</Text>
                                                <Text style={styles.statValue}>{selectedRoom.genderPreference}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.tagsContainer}>
                                            <Text style={styles.tagsLabel}>Amenities</Text>
                                            <View style={styles.tagsWrap}>
                                                {selectedRoom.amenities?.map((item, idx) => (
                                                    <View key={idx} style={styles.tag}>
                                                        <Text style={styles.tagText}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.tagsContainer}>
                                            <Text style={styles.tagsLabel}>House Rules</Text>
                                            <View style={styles.tagsWrap}>
                                                {selectedRoom.houseRules?.map((item, idx) => (
                                                    <View key={idx} style={styles.tag}>
                                                        <Text style={styles.tagText}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Ownership Context</Text>
                                    <View style={styles.ownerCard}>
                                        <Image
                                            source={{ uri: selectedRoom.owner?.avatar?.url || `https://ui-avatars.com/api/?name=${selectedRoom.owner?.name}` }}
                                            style={styles.ownerAvatar}
                                        />
                                        <View style={styles.ownerInfo}>
                                            <Text style={styles.ownerName}>{selectedRoom.owner?.name}</Text>
                                            <Text style={styles.ownerEmail}>{selectedRoom.owner?.email}</Text>
                                            <View style={styles.verificationBadge}>
                                                <ShieldCheck size={12} color={selectedRoom.owner?.verified ? "#10B981" : "#EF4444"} />
                                                <Text style={[styles.verificationText, { color: selectedRoom.owner?.verified ? "#10B981" : "#EF4444" }]}>
                                                    {selectedRoom.owner?.verified ? 'Identity Verified' : 'Unverified Account'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Decision Rational</Text>
                                    <TextInput
                                        style={styles.rejectionInput}
                                        placeholder="Specify non-compliance details if rejecting..."
                                        multiline
                                        numberOfLines={4}
                                        value={rejectionReason}
                                        onChangeText={setRejectionReason}
                                    />
                                </View>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.approveBtn]}
                                        onPress={() => handleAction('approve')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <View style={styles.btnContent}>
                                                <CheckCircle size={20} color="#FFFFFF" />
                                                <Text style={styles.btnText}>Authorize</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.rejectBtn]}
                                        onPress={() => handleAction('reject')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <View style={styles.btnContent}>
                                                <XCircle size={20} color="#FFFFFF" />
                                                <Text style={styles.btnText}>Decline</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
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
        paddingHorizontal: 20,
        paddingVertical: 12,
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
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
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
    content: { flex: 1 },
    listContent: { padding: 20 },
    roomCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
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
    roomThumb: { width: 70, height: 70, borderRadius: 16, backgroundColor: '#F3F4F6' },
    roomInfo: { flex: 1, marginLeft: 16 },
    roomTitle: { fontSize: 14, fontWeight: '800', color: '#111827', textTransform: 'uppercase', marginBottom: 4 },
    roomLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    locationText: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginLeft: 4 },
    roomMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    priceText: { fontSize: 13, fontWeight: '900', color: '#2563EB' },
    typeTag: { fontSize: 9, fontWeight: '900', color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, textTransform: 'uppercase' },
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
    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
    exactBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    exactText: { fontSize: 9, fontWeight: '900', color: '#2563EB', textTransform: 'uppercase' },
    mapContainer: { height: 200, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
    map: { flex: 1 },
    imageScroll: { flexDirection: 'row' },
    detailImage: { width: width * 0.7, height: 200, borderRadius: 24, marginRight: 12, backgroundColor: '#F3F4F6' },
    detailsCard: { backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    detailTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 12 },
    detailDesc: { fontSize: 14, fontWeight: '500', color: '#4B5563', lineHeight: 22, fontStyle: 'italic', marginBottom: 24 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 20, marginBottom: 20 },
    statBox: { alignItems: 'center', flex: 1 },
    statLabel: { fontSize: 9, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
    statValue: { fontSize: 14, fontWeight: '900', color: '#111827', textTransform: 'uppercase' },
    tagsContainer: { marginTop: 16 },
    tagsLabel: { fontSize: 10, fontWeight: '900', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    tagText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
    ownerCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#F9FAFB', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6' },
    ownerAvatar: { width: 56, height: 56, borderRadius: 20 },
    ownerInfo: { flex: 1, marginLeft: 16 },
    ownerName: { fontSize: 14, fontWeight: '900', color: '#111827', textTransform: 'uppercase' },
    ownerEmail: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginVertical: 4 },
    verificationBadge: { flexDirection: 'row', alignItems: 'center' },
    verificationText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginLeft: 4 },
    rejectionInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 16,
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        textAlignVertical: 'top'
    },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    actionBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    approveBtn: { backgroundColor: '#10B981' },
    rejectBtn: { backgroundColor: '#EF4444' },
    btnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 }
});

export default AdminRoomsScreen;
