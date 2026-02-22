import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    StyleSheet,
    TextInput,
    RefreshControl,
    Modal,
    ScrollView,
    Dimensions,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Grid, List as ListIcon, Map as MapIcon, Filter, X, LocateFixed, ChevronDown, CheckCircle, Search, School, MapPin, ArrowRight, SlidersHorizontal, Building, Users, Layers, Home, Zap, ShieldCheck, Star, Snowflake, Wifi, Utensils, GraduationCap } from 'lucide-react-native';
import GlobalMapView from '../components/rooms/MapView';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import FilterModal from '../components/rooms/FilterModal';
import { INDIAN_LOCATIONS } from '../constants';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { getGeocodingSuggestions, reverseGeocode } from '../utils/helpers';

const { width } = Dimensions.get('window');

const SearchHeader = React.memo(({
    user,
    filters,
    localSearch,
    setLocalSearch,
    handleSearchSubmit,
    localAddress,
    setLocalAddress,
    handleAddressSubmit,
    resetFilters,
    setShowFilters,
    setLocationModalVisible,
    handleCurrentLocation,
    usingCurrentLocation,
    viewMode,
    setViewMode,
    roomCount,
    navigation,
    colleges,
    selectedCollege,
    setSelectedCollege,
    radius,
    setRadius,
    setCollegeModalVisible,
    handleApplyFilters,
    handleClearCollege,
    setFilters,
    fetchRooms,
    suggestions,
    showSuggestions,
    handleAddressChange,
    handleSuggestionSelect,
    setShowSuggestions,
    suggestionsLoading
}) => {
    return (
        <View style={styles.headerContainer}>
            {/* Header Title Section */}
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.headerSubtitle}>Find your home</Text>
                    <Text style={styles.headerTitle}>HomeSarthi</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation?.navigate?.('Profile')}
                    style={styles.profileButton}
                >
                    <Image
                        source={{ uri: user?.avatar?.url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}` }}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>
            </View>

            {/* Property Category Boxes - Matches User Request */}
            <View style={styles.sectionContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.sectionLabel}>SELECT CATEGORY</Text>
                        {(filters.state || filters.city || filters.latitude || filters.search || filters.roomTypes.length > 0 || filters.minRent || filters.maxRent) ? (
                            <TouchableOpacity onPress={resetFilters} style={{ marginLeft: 12 }}>
                                <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold' }}>RESET ALL</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <TouchableOpacity onPress={() => setShowFilters(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <SlidersHorizontal size={14} color="#2563EB" />
                        <Text style={[styles.sectionLabel, { marginBottom: 0, marginLeft: 4 }]}>FILTERS</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                    <View style={styles.categoryGrid}>
                        {[
                            { value: '1RK', label: '1 RK', icon: Building },
                            { value: '1BHK', label: '1 BHK', icon: Building },
                            { value: '2BHK', label: '2 BHK', icon: Building },
                            { value: '3BHK', label: '3 BHK', icon: Building },
                            { value: 'PG', label: 'PG', icon: Building },
                            { value: 'Hostel', label: 'Hostel', icon: Users },
                            { value: 'Flat', label: 'Flat', icon: Layers },
                            { value: 'Individual', label: 'Individual', icon: Home }
                        ].map((item) => {
                            const isSelected = filters.roomTypes.includes(item.value);
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    onPress={() => {
                                        const newTypes = isSelected
                                            ? filters.roomTypes.filter(t => t !== item.value)
                                            : [...filters.roomTypes, item.value];
                                        handleApplyFilters({ ...filters, roomTypes: newTypes });
                                    }}
                                    style={[styles.categoryBox, isSelected && styles.categoryBoxActive]}
                                >
                                    <View style={[styles.categoryIconCircle, isSelected && styles.categoryIconCircleActive]}>
                                        <item.icon size={18} color={isSelected ? '#FFF' : '#2563EB'} />
                                    </View>
                                    <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                                        {item.label}
                                    </Text>
                                    {isSelected && (
                                        <View style={styles.checkBadge}>
                                            <CheckCircle size={10} color="#2563EB" fill="#FFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

            </View>

            {/* Location Section */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>LOCATION</Text>




                {/* State/City Dropdowns */}
                <View style={styles.row}>
                    <View style={[styles.dropdown, { marginRight: 10, flexDirection: 'row', alignItems: 'center' }]}>
                        <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            onPress={() => setLocationModalVisible('state')}
                        >
                            <Text style={[styles.dropdownText, !filters.state && styles.placeholderText]} numberOfLines={1}>
                                {filters.state || 'All States'}
                            </Text>
                            <ChevronDown size={16} color="#6B7280" />
                        </TouchableOpacity>
                        {filters.state && (
                            <TouchableOpacity
                                onPress={() => {
                                    const newFilters = { ...filters, state: '', city: '' };
                                    setFilters(newFilters);
                                    fetchRooms(newFilters);
                                }}
                                style={{ marginLeft: 8, padding: 2 }}
                            >
                                <X size={14} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.dropdown, !filters.state && styles.disabled, { flexDirection: 'row', alignItems: 'center' }]}>
                        <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            onPress={() => filters.state && setLocationModalVisible('city')}
                            disabled={!filters.state}
                        >
                            <Text style={[styles.dropdownText, !filters.city && styles.placeholderText]} numberOfLines={1}>
                                {filters.city || 'All Cities'}
                            </Text>
                            <ChevronDown size={16} color={filters.state ? "#6B7280" : "#D1D5DB"} />
                        </TouchableOpacity>
                        {filters.city && (
                            <TouchableOpacity
                                onPress={() => {
                                    const newFilters = { ...filters, city: '' };
                                    setFilters(newFilters);
                                    fetchRooms(newFilters);
                                }}
                                style={{ marginLeft: 8, padding: 2 }}
                            >
                                <X size={14} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* College & Radius Selector */}
                <View style={[styles.row, { marginTop: 10 }]}>
                    <TouchableOpacity
                        style={[styles.dropdown, { marginRight: 10, flex: 1.5 }]}
                        onPress={() => setCollegeModalVisible(true)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <School size={16} color={selectedCollege ? "#2563EB" : "#6B7280"} style={{ marginRight: 8 }} />
                            <Text style={[styles.dropdownText, !selectedCollege && styles.placeholderText]} numberOfLines={1}>
                                {selectedCollege ? selectedCollege.name : 'Select College'}
                            </Text>
                        </View>
                        {selectedCollege ? (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleClearCollege?.();
                                }}
                                style={{ padding: 4 }}
                            >
                                <X size={16} color="#EF4444" />
                            </TouchableOpacity>
                        ) : (
                            <ChevronDown size={16} color="#6B7280" />
                        )}
                    </TouchableOpacity>

                    <View style={styles.radiusContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                            {[200, 300, 500, 1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000].map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.radiusChip, radius === r && styles.radiusChipSelected]}
                                    onPress={() => setRadius(r)}
                                >
                                    <Text style={[styles.radiusText, radius === r && styles.radiusTextSelected]}>
                                        {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Map/Address Bar with Suggestions Wrapper - FORCED TOP LAYER */}
                <View style={{ position: 'relative', zIndex: 99999, elevation: 999 }}>
                    <View style={[styles.inputCard, styles.marginTop]}>
                        <MapPin size={20} color="#6B7280" />
                        <TextInput
                            style={styles.textInput}
                            placeholder={filters.city ? `Search within ${filters.city}...` : "Area, Landmark or City..."}
                            value={localAddress}
                            onChangeText={handleAddressChange}
                            onSubmitEditing={handleAddressSubmit}
                            returnKeyType="search"
                            placeholderTextColor="#9CA3AF"
                        />

                        <View style={styles.iconGroup}>
                            {suggestionsLoading ? (
                                <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
                            ) : localAddress.length > 0 ? (
                                <TouchableOpacity onPress={() => { setLocalAddress(''); setShowSuggestions(false); handleAddressSubmit(); }} style={styles.iconButton}>
                                    <X size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity onPress={handleCurrentLocation} disabled={usingCurrentLocation} style={styles.iconButton}>
                                {usingCurrentLocation ? (
                                    <ActivityIndicator size="small" color="#2563EB" />
                                ) : (
                                    <LocateFixed size={20} color="#2563EB" />
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} style={styles.iconButton}>
                                <MapIcon size={20} color={viewMode === 'map' ? "#2563EB" : "#6B7280"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Auto-Complete Suggestions List - Moved outside inputCard to prevent clipping */}
                    {showSuggestions && suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <ScrollView keyboardShouldPersistTaps="always">
                                {suggestions.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionItem}
                                        onPress={() => handleSuggestionSelect(item)}
                                    >
                                        <MapPin size={14} color="#6B7280" style={{ marginRight: 10 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.suggestionAddress} numberOfLines={1}>{item.description}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Searching Near Indicator (Premium Style) */}
                {
                    (filters.latitude && filters.longitude) ? (
                        <View style={{ marginTop: 15, backgroundColor: '#EFF6FF', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#BFDBFE' }}>
                            <MapPin size={16} color="#2563EB" />
                            <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#60A5FA', textTransform: 'uppercase', letterSpacing: 1 }}>Searching near:</Text>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E40AF' }} numberOfLines={1}>
                                    {selectedCollege ? selectedCollege.name : (filters.address || 'Selected Location')}
                                </Text>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#60A5FA' }}>Radius: {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</Text>
                            </View>
                        </View>
                    ) : null
                }
            </View >

            {/* Results Bar */}
            < View style={styles.resultsBar} >
                <Text style={styles.resultsText}>
                    Found <Text style={styles.boldText}>{roomCount}</Text> result{roomCount !== 1 ? 's' : ''}
                </Text>

                {
                    viewMode !== 'map' && (
                        <View style={styles.viewToggles}>
                            <TouchableOpacity
                                onPress={() => setViewMode('grid')}
                                style={[styles.toggleBtn, viewMode === 'grid' && styles.activeToggle]}
                            >
                                <Grid size={18} color={viewMode === 'grid' ? '#2563EB' : '#9CA3AF'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setViewMode('list')}
                                style={[styles.toggleBtn, viewMode === 'list' && styles.activeToggle]}
                            >
                                <ListIcon size={18} color={viewMode === 'list' ? '#2563EB' : '#9CA3AF'} />
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View >
        </View >
    );
});

const DashboardScreen = ({ navigation, route }) => {
    const user = useAuthStore((state) => state?.user);

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // Default to list for better mobile view
    const [showFilters, setShowFilters] = useState(false);
    const [locationModalVisible, setLocationModalVisible] = useState(null); // 'state', 'city', or 'college'
    const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

    // College Search State
    const [colleges, setColleges] = useState([]);
    const [collegeSearch, setCollegeSearch] = useState('');
    const [collegeModalVisible, setCollegeModalVisible] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [radius, setRadius] = useState(2000); // Default 2km
    const [collegesLoading, setCollegesLoading] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        state: '',
        city: route?.params?.city || '',
        latitude: null,
        longitude: null,
        radius: 10000,
        address: '',
        minRent: '',
        maxRent: '',
        roomTypes: [], // multiple
        amenities: [],
        genderPreference: '',
        furnishing: [],
        electricityBillIncluded: 'all',
        availableFrom: '',
        sortBy: '-createdAt'
    });

    const [localSearch, setLocalSearch] = useState('');
    const [localAddress, setLocalAddress] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Auto-complete suggestions state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [geocodingTimeout, setGeocodingTimeout] = useState(null);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    // Sync filters with route params when they change
    useEffect(() => {
        if (route?.params?.city) {
            setFilters(prev => ({
                ...prev,
                city: route.params.city,
                state: '', // Clear state if city is selected from home
                latitude: null, // Clear distance search
                longitude: null
            }));
        }
    }, [route?.params?.city]);

    useEffect(() => {
        setLocalSearch(filters.search);
        setLocalAddress(filters.address);
    }, [filters.search, filters.address]);

    const fetchRooms = useCallback(async (currentFilters = filters, pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            else setLoadingMore(true);

            const params = new URLSearchParams();
            params.append('page', pageNumber);
            params.append('limit', 15);

            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.state) params.append('state', currentFilters.state);
            if (currentFilters.city) params.append('city', currentFilters.city);

            // Location Params (Prioritize Bounds for OLX-style movement)
            if (currentFilters.neLat && currentFilters.neLng) {
                params.append('neLat', currentFilters.neLat);
                params.append('neLng', currentFilters.neLng);
                params.append('swLat', currentFilters.swLat);
                params.append('swLng', currentFilters.swLng);
            }

            if (currentFilters.latitude && currentFilters.longitude) {
                params.append('latitude', currentFilters.latitude);
                params.append('longitude', currentFilters.longitude);
                params.append('radius', currentFilters.radius || radius); // Use filter radius or state radius
            }

            if (currentFilters.minRent) params.append('minRent', currentFilters.minRent);
            if (currentFilters.maxRent) params.append('maxRent', currentFilters.maxRent);
            if (currentFilters.roomTypes?.length) params.append('roomType', currentFilters.roomTypes.join(','));
            if (currentFilters.genderPreference) params.append('genderPreference', currentFilters.genderPreference);
            if (currentFilters.amenities?.length) params.append('amenities', currentFilters.amenities.join(','));
            if (currentFilters.furnishing?.length) params.append('furnishing', currentFilters.furnishing.join(','));
            if (currentFilters.electricityBillIncluded && currentFilters.electricityBillIncluded !== 'all') {
                params.append('electricityBillIncluded', currentFilters.electricityBillIncluded);
            }
            if (currentFilters.availableFrom) params.append('availableFrom', currentFilters.availableFrom);
            params.append('sortBy', currentFilters.sortBy);

            const { data } = await api.get(`/rooms?${params.toString()}`);
            if (data?.success) {
                const roomList = data.data?.rooms || data.data || [];
                const roomsArray = Array.isArray(roomList) ? roomList : [];

                if (pageNumber === 1) {
                    setRooms(roomsArray);
                    setPage(1);
                } else {
                    setRooms(prev => [...prev, ...roomsArray]);
                }

                setHasMore(roomsArray.length === 15);
            }
        } catch (error) {
            console.error('Fetch rooms error:', error);
            if (pageNumber === 1) setRooms([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [filters, radius]); // Added radius dependency

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchRooms(filters, nextPage);
        }
    };

    useEffect(() => {
        fetchColleges();
        // Auto-Location Intelligence: Detect location on startup
        if (!route?.params?.city) {
            handleCurrentLocation();
        } else {
            fetchRooms();
        }
    }, []);

    const handleMapRegionChange = useCallback((region) => {
        // Calculate viewport bounds from map region
        const neLat = region.latitude + region.latitudeDelta / 2;
        const neLng = region.longitude + region.longitudeDelta / 2;
        const swLat = region.latitude - region.latitudeDelta / 2;
        const swLng = region.longitude - region.longitudeDelta / 2;

        // Auto Radius Logic based on zoom level (delta)
        // 1 deg latitude ≈ 111km. We use half of the larger delta for radius.
        const calculatedRadius = Math.floor(Math.max(region.latitudeDelta, region.longitudeDelta) * 55555);

        const newMapFilters = {
            ...filters,
            latitude: region.latitude,
            longitude: region.longitude,
            neLat, neLng, swLat, swLng,
            radius: calculatedRadius,
            state: '', // Map move overrides text search
            city: ''
        };

        // Update state and fetch
        setFilters(newMapFilters);
        // Throttle/Debounce could be added here, but for now simple update
        fetchRooms(newMapFilters);
    }, [filters, fetchRooms]);

    // Refresh data when screen comes into focus (e.g., returning from another tab)
    useFocusEffect(
        useCallback(() => {
            // Refresh rooms with current filters when screen is focused
            fetchRooms(filters);
        }, [filters, fetchRooms]) // Include dependencies to use current state
    );

    const fetchColleges = async () => {
        try {
            setCollegesLoading(true);
            const { data } = await api.get('/rooms/colleges');
            if (data.success) {
                setColleges(data.data.colleges || []);
            }
        } catch (error) {
            console.error('Failed to fetch colleges', error);
            Alert.alert('Error', 'Failed to load colleges. Please try again.');
        } finally {
            setCollegesLoading(false);
        }
    };

    const handleCollegeSelect = (college) => {
        if (!college || !college.coordinates) {
            Alert.alert('Error', 'Location data for this college is not available.');
            return;
        }

        setSelectedCollege(college);
        setCollegeModalVisible(false);
        setLocalAddress(college.name);

        // Auto-update filters to search near this college
        // Don't set state/city - only use lat/long for proximity search
        const newFilters = {
            ...filters,
            latitude: college.coordinates.latitude,
            longitude: college.coordinates.longitude,
            state: '', // Clear state when using college location
            city: '', // Clear city when using college location
            address: college.name,
            radius: 500 // Student Priority Mode: Default 500m for walking distance
        };
        setRadius(500);
        setFilters(newFilters);
        fetchRooms(newFilters);
    };

    const handleClearCollege = () => {
        setSelectedCollege(null);
        setLocalAddress('');
        const clearedFilters = {
            ...filters,
            latitude: null,
            longitude: null,
            address: '',
            state: '', // Clear state
            city: '', // Clear city
            radius: 10000
        };
        setFilters(clearedFilters);
        fetchRooms(clearedFilters);
    };

    // Update rooms when radius changes if we have a location set
    useEffect(() => {
        if (filters.latitude && filters.longitude) {
            const newFilters = { ...filters, radius: radius };
            setFilters(newFilters);
            fetchRooms(newFilters);
        }
    }, [radius]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        fetchRooms(newFilters);
    };

    const handleSearchSubmit = () => {
        // Clear conflicting location filters when doing a text search
        const newFilters = {
            ...filters,
            search: localSearch,
            state: '',
            city: '',
            latitude: null,
            longitude: null,
            address: localSearch
        };
        setSelectedCollege(null);
        setLocalAddress(localSearch);
        setFilters(newFilters);
        fetchRooms(newFilters);
    };

    const handleAddressSubmit = async () => {
        const isClearing = !localAddress || localAddress.trim() === '';

        if (isClearing) {
            const clearedFilters = {
                ...filters,
                search: '',
                address: '',
                state: '',
                city: '',
                latitude: null,
                longitude: null,
                radius: 10000
            };
            setRadius(10000);
            setFilters(clearedFilters);
            fetchRooms(clearedFilters);
            return;
        }

        // If we have local address but no lat/lng, try to find a match from suggestions
        if (!filters.latitude && !filters.longitude && suggestions.length > 0) {
            // Auto-select the first result if it's a strong match or just to be helpful
            handleSuggestionSelect(suggestions[0]);
            return;
        }

        // Standard Text Search Fallback
        const newFilters = {
            ...filters,
            search: localAddress,
            address: localAddress,
            state: '',
            city: '',
            latitude: null,
            longitude: null,
        };

        setShowSuggestions(false);
        setSelectedCollege(null);
        setFilters(newFilters);
        fetchRooms(newFilters);
    };

    const handleAddressChange = async (text) => {
        setLocalAddress(text);
        if (text.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (geocodingTimeout) clearTimeout(geocodingTimeout);

        const timeout = setTimeout(async () => {
            try {
                setSuggestionsLoading(true);
                // EXTREME SPEED: Combined bias with current coordinates if available
                const bias = {
                    state: filters.state,
                    city: filters.city,
                    latitude: filters.latitude,
                    longitude: filters.longitude
                };

                const results = await getGeocodingSuggestions(text, 5, bias);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (error) {
                console.error('Suggestions fetch error:', error);
            } finally {
                setSuggestionsLoading(false);
            }
        }, 300); // Faster debounce: 500ms -> 300ms
        setGeocodingTimeout(timeout);
    };

    const handleSuggestionSelect = (suggestion) => {
        setLocalAddress(suggestion.name);
        setShowSuggestions(false);

        const newFilters = {
            ...filters,
            address: suggestion.fullAddress,
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            radius: 5000, // Increased radius for specific landmark from 2km to 5km
            state: suggestion.state || '',
            city: suggestion.city || ''
        };

        setFilters(newFilters);
        fetchRooms(newFilters);
    };

    const resetFilters = () => {
        const defaultFilters = {
            search: '', state: '', city: '',
            latitude: null, longitude: null, radius: 10000, address: '',
            minRent: '', maxRent: '', roomTypes: [], amenities: [], genderPreference: '',
            furnishing: [], electricityBillIncluded: 'all', availableFrom: '',
            sortBy: '-createdAt'
        };
        setLocalSearch('');
        setLocalAddress('');
        setFilters(defaultFilters);
        setSelectedCollege(null);
        setRadius(2000);
        // Instant reload
        fetchRooms(defaultFilters);
    };

    const updateLocation = (type, value) => {
        const newFilters = { ...filters };
        if (type === 'state') {
            newFilters.state = value;
            newFilters.city = ''; // Reset city when state changes
        } else {
            newFilters.city = value;
        }
        // Clear college-based location when manually selecting state/city
        newFilters.latitude = null;
        newFilters.longitude = null;
        newFilters.address = '';

        setSelectedCollege(null); // Clear selected college
        setLocalAddress(''); // Clear address input
        setFilters(newFilters);
        setLocationModalVisible(null);
        fetchRooms(newFilters); // Auto-fetch on selection
    };

    const handleCurrentLocation = async () => {
        try {
            setUsingCurrentLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                // FALLBACK: If permission denied, standard to a default active area (e.g., city center)
                setUsingCurrentLocation(false);
                fetchRooms(); // Load default results
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Reverse Geocode to get actual address/city
            const geoData = await reverseGeocode(latitude, longitude);
            const displayAddress = geoData?.city ? `${geoData.city}${geoData.address ? `, ${geoData.address.split(',')[0]}` : ''}` : 'Current Location';

            const newFilters = {
                ...filters,
                latitude,
                longitude,
                state: geoData?.state || '',
                city: geoData?.city || '',
                address: geoData?.address || 'Current Location'
            };

            setSelectedCollege(null);
            setLocalAddress(displayAddress);
            setFilters(newFilters);
            fetchRooms(newFilters);
            if (geoData?.city) {
                Alert.alert('Location Updated', `Showing rooms near ${geoData.city}`);
            }
            Alert.alert('Location Updated', 'Showing rooms near your location.');
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Could not fetch location.');
        } finally {
            setUsingCurrentLocation(false);
        }
    };



    const renderRoom = ({ item }) => {
        if (!item) return null;
        const isGrid = viewMode === 'grid';

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation?.navigate?.('RoomDetails', { roomId: item?._id })}
                style={[
                    styles.card,
                    isGrid ? styles.cardGrid : styles.cardList
                ]}
            >
                <Image
                    source={{ uri: item?.images?.[0]?.url || 'https://via.placeholder.com/400x300' }}
                    style={isGrid ? styles.imageGrid : styles.imageList}
                    resizeMode="cover"
                />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item?.title || 'Untitled Room'}</Text>
                        <Text style={styles.cardPrice}>₹{item?.rent?.amount || 0}</Text>
                    </View>

                    <View style={styles.cardLocation}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item?.location?.address?.city || item?.location?.city || 'Unknown Location'}
                        </Text>
                    </View>

                    {/* New Attributes Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {item.furnishing && (
                            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, color: '#4B5563', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                    {item.furnishing.replace('-', ' ')}
                                </Text>
                            </View>
                        )}
                        {item.rent?.electricityBillIncluded && (
                            <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <Zap size={8} color="#92400E" fill="#92400E" />
                                <Text style={{ fontSize: 9, color: '#92400E', fontWeight: 'bold' }}>
                                    Elec. Inc.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Distance Badge */}
                    {item.distance && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <MapPin size={10} color="#2563EB" />
                            <Text style={{ fontSize: 10, color: '#2563EB', fontWeight: '700', marginLeft: 4 }}>
                                {(item.distance.meters / 1000).toFixed(1)} km away
                            </Text>
                        </View>
                    )}

                    <View style={styles.cardFooter}>
                        <View style={[
                            styles.badge,
                            {
                                backgroundColor: ['1RK', '1BHK', '2BHK', '3BHK'].includes(item?.roomType) ? '#DBEAFE' :
                                    item?.roomType === 'PG' ? '#DBEAFE' :
                                        item?.roomType === 'Hostel' ? '#E0E7FF' :
                                            item?.roomType === 'Flat' ? '#EDE9FE' :
                                                item?.roomType === 'Individual' ? '#FAE8FF' : '#F3F4F6'
                            }
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                {
                                    color: ['1RK', '1BHK', '2BHK', '3BHK'].includes(item?.roomType) ? '#2563EB' :
                                        item?.roomType === 'PG' ? '#2563EB' :
                                            item?.roomType === 'Hostel' ? '#4F46E5' :
                                                item?.roomType === 'Flat' ? '#7C3AED' :
                                                    item?.roomType === 'Individual' ? '#C026D3' : '#6B7280'
                                }
                            ]}>
                                {item?.roomType || 'Room'}
                            </Text>
                        </View>
                        <Text style={[
                            styles.statusText,
                            item?.availability?.status === 'available' ? styles.textGreen : styles.textRed
                        ]}>
                            {item?.availability?.status === 'available' ? 'Available' : 'Booked'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View style={{ flex: 1 }}>
                {loading && !refreshing && rooms.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                ) : viewMode === 'map' ? (
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                        }
                        scrollEnabled={false}
                    >
                        <View style={styles.mapContainer}>
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9990, backgroundColor: 'white', elevation: 10 }}>
                                <SearchHeader
                                    user={user}
                                    filters={filters}
                                    localSearch={localSearch}
                                    setLocalSearch={setLocalSearch}
                                    handleSearchSubmit={handleSearchSubmit}
                                    localAddress={localAddress}
                                    setLocalAddress={setLocalAddress}
                                    handleAddressSubmit={handleAddressSubmit}
                                    resetFilters={resetFilters}
                                    setShowFilters={setShowFilters}
                                    setLocationModalVisible={setLocationModalVisible}
                                    handleCurrentLocation={handleCurrentLocation}
                                    usingCurrentLocation={usingCurrentLocation}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    roomCount={rooms.length}
                                    navigation={navigation}
                                    colleges={colleges}
                                    selectedCollege={selectedCollege}
                                    setSelectedCollege={handleCollegeSelect}
                                    radius={radius}
                                    setRadius={setRadius}
                                    setCollegeModalVisible={setCollegeModalVisible}
                                    handleApplyFilters={handleApplyFilters}
                                    handleClearCollege={handleClearCollege}
                                    setFilters={setFilters}
                                    fetchRooms={fetchRooms}
                                    suggestions={suggestions}
                                    showSuggestions={showSuggestions}
                                    handleAddressChange={handleAddressChange}
                                    handleSuggestionSelect={handleSuggestionSelect}
                                    setShowSuggestions={setShowSuggestions}
                                    suggestionsLoading={suggestionsLoading}
                                />
                            </View>
                            <View style={{ flex: 1, marginTop: 320, height: 500 }}>
                                <GlobalMapView
                                    rooms={rooms}
                                    navigation={navigation}
                                    height="100%"
                                    onRegionChange={handleMapRegionChange}
                                />
                            </View>
                        </View>
                    </ScrollView>
                ) : (
                    <FlatList
                        data={rooms}
                        key={viewMode} // Force re-render on layout change
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        renderItem={renderRoom}
                        keyExtractor={(item) => item?._id}
                        ListHeaderComponent={
                            <SearchHeader
                                user={user}
                                filters={filters}
                                localSearch={localSearch}
                                setLocalSearch={setLocalSearch}
                                handleSearchSubmit={handleSearchSubmit}
                                localAddress={localAddress}
                                setLocalAddress={setLocalAddress}
                                handleAddressSubmit={handleAddressSubmit}
                                resetFilters={resetFilters}
                                setShowFilters={setShowFilters}
                                setLocationModalVisible={setLocationModalVisible}
                                handleCurrentLocation={handleCurrentLocation}
                                usingCurrentLocation={usingCurrentLocation}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                roomCount={rooms.length}
                                navigation={navigation}
                                colleges={colleges}
                                selectedCollege={selectedCollege}
                                setSelectedCollege={handleCollegeSelect}
                                radius={radius}
                                setRadius={setRadius}
                                setCollegeModalVisible={setCollegeModalVisible}
                                handleApplyFilters={handleApplyFilters}
                                handleClearCollege={handleClearCollege}
                                setFilters={setFilters}
                                fetchRooms={fetchRooms}
                                suggestions={suggestions}
                                showSuggestions={showSuggestions}
                                handleAddressChange={handleAddressChange}
                                handleSuggestionSelect={handleSuggestionSelect}
                                setShowSuggestions={setShowSuggestions}
                                suggestionsLoading={suggestionsLoading}
                            />
                        }
                        ListHeaderComponentStyle={{
                            zIndex: 0,
                            elevation: 100,
                            backgroundColor: 'white',
                            overflow: 'visible',
                            marginBottom: 10
                        }}
                        contentContainerStyle={styles.listContainer}
                        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="always" // Better for suggestions
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            loadingMore ? (
                                <View style={{ paddingVertical: 20 }}>
                                    <ActivityIndicator size="small" color="#2563EB" />
                                </View>
                            ) : hasMore && rooms.length > 0 ? (
                                <TouchableOpacity onPress={handleLoadMore} style={{ alignItems: 'center', paddingVertical: 20 }}>
                                    <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: 'bold' }}>See More Listings</Text>
                                </TouchableOpacity>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }}
                                    style={{ width: 120, height: 120, marginBottom: 20, opacity: 0.5 }}
                                />
                                <Text style={styles.emptyTitle}>No rooms in this area</Text>
                                <Text style={styles.emptySubtitle}>
                                    We couldn't find any rooms within {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`} of your search. {"\n\n"}
                                    💡 Try increasing the search radius or search for the city name (e.g. Gorakhpur).
                                </Text>
                                <TouchableOpacity onPress={resetFilters} style={styles.clearBtn}>
                                    <Text style={styles.clearBtnText}>Clear Search & Reset</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>

            <FilterModal
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                onApply={handleApplyFilters}
            />

            <Modal
                visible={!!locationModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setLocationModalVisible(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select {locationModalVisible === 'state' ? 'State' : 'City'}</Text>
                            <TouchableOpacity onPress={() => setLocationModalVisible(null)}>
                                <X size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {locationModalVisible === 'state' ? (
                                Object.keys(INDIAN_LOCATIONS).map((state) => (
                                    <TouchableOpacity key={state} style={[styles.modalItem, filters.state === state && styles.modalItemSelected]} onPress={() => updateLocation('state', state)}>
                                        <Text style={[styles.modalItemText, filters.state === state && styles.modalItemTextSelected]}>{state}</Text>
                                        {filters.state === state && <MapPin size={16} color="#2563EB" />}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                filters.state && INDIAN_LOCATIONS[filters.state]?.map((city) => (
                                    <TouchableOpacity key={city} style={[styles.modalItem, filters.city === city && styles.modalItemSelected]} onPress={() => updateLocation('city', city)}>
                                        <Text style={[styles.modalItemText, filters.city === city && styles.modalItemTextSelected]}>{city}</Text>
                                        {filters.city === city && <MapPin size={16} color="#2563EB" />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={collegeModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setCollegeModalVisible(false);
                    setCollegeSearch('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select College</Text>
                            <TouchableOpacity onPress={() => {
                                setCollegeModalVisible(false);
                                setCollegeSearch('');
                            }}>
                                <X size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ padding: 12, backgroundColor: '#F3F4F6' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12 }}>
                                <Search size={16} color="#6B7280" />
                                <TextInput
                                    placeholder="Search college by name or city..."
                                    style={{ flex: 1, padding: 10, fontSize: 14 }}
                                    value={collegeSearch}
                                    onChangeText={setCollegeSearch}
                                    autoFocus={true}
                                    placeholderTextColor="#9CA3AF"
                                />
                                {collegeSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setCollegeSearch('')}>
                                        <X size={16} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {collegesLoading ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#2563EB" />
                                    <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280' }}>Loading colleges...</Text>
                                </View>
                            ) : colleges.length === 0 ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <School size={48} color="#D1D5DB" />
                                    <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: '#6B7280' }}>No colleges available</Text>
                                    <Text style={{ marginTop: 4, fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>Please check your connection and try again</Text>
                                    <TouchableOpacity
                                        onPress={fetchColleges}
                                        style={{ marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
                                    >
                                        <Text style={{ color: '#FFF', fontWeight: '600' }}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : colleges.filter(c => {
                                const searchLower = collegeSearch.toLowerCase().trim();
                                if (!searchLower) return true;
                                const nameLower = (c.name || '').toLowerCase();
                                const cityLower = (c.city || '').toLowerCase();
                                return nameLower.includes(searchLower) || cityLower.includes(searchLower);
                            }).length === 0 ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Search size={48} color="#D1D5DB" />
                                    <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: '#6B7280' }}>No results found</Text>
                                    <Text style={{ marginTop: 4, fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
                                        Try searching with different keywords
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setCollegeSearch('')}
                                        style={{ marginTop: 16, backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
                                    >
                                        <Text style={{ color: '#374151', fontWeight: '600' }}>Clear Search</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                colleges.filter(c => {
                                    const searchLower = collegeSearch.toLowerCase().trim();
                                    if (!searchLower) return true;
                                    const nameLower = (c.name || '').toLowerCase();
                                    const cityLower = (c.city || '').toLowerCase();
                                    return nameLower.includes(searchLower) || cityLower.includes(searchLower);
                                }).map((college, index) => (
                                    <TouchableOpacity
                                        key={college.id || `college-${index}`}
                                        style={[styles.modalItem, selectedCollege?.id === college.id && styles.modalItemSelected]}
                                        onPress={() => {
                                            handleCollegeSelect(college);
                                            setCollegeSearch('');
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.modalItemText, selectedCollege?.id === college.id && styles.modalItemTextSelected]}>
                                                {college.name}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                                {college.city || 'Lucknow'}
                                            </Text>
                                        </View>
                                        {selectedCollege?.id === college.id && <School size={16} color="#2563EB" />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: 'smoke',
        zIndex: 5000, // Very high for the entire header
        elevation: 5, // For Android
        overflow: 'visible',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 25,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#2563EB',
        letterSpacing: -0.5,
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#EFF6FF',
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#2563EB',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    clearText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#DC2626', // Red color for clear action
        marginBottom: 8,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
        height: '100%',
    },
    row: {
        flexDirection: 'row',
    },
    dropdown: {
        flex: 1,
        height: 52,
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },
    disabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#F3F4F6',
        opacity: 0.6,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    placeholderText: {
        color: '#9CA3AF',
        fontWeight: '500',
    },
    marginTop: {
        marginTop: 12,
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#D1D5DB',
    },
    iconButton: {
        padding: 4,
    },
    resultsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 8,
    },
    resultsText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    boldText: {
        color: '#111827',
        fontWeight: '700',
    },
    viewToggles: {
        flexDirection: 'row',
        gap: 8,
    },
    toggleBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    activeToggle: {
        backgroundColor: '#EFF6FF',
    },
    // List Styles
    listContainer: {
        paddingTop: 16,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
        zIndex: 1, // Explicitly lower than header (10000)
    },
    cardList: {
        marginTop: 0,
        marginHorizontal: 20,
    },
    cardGrid: {
        width: (width - 52) / 2, // (Screen width - padding (40) - gap (12)) / 2
        marginBottom: 16,
    },
    imageList: {
        width: '100%',
        height: 200,
    },
    imageGrid: {
        width: '100%',
        height: 140,
    },
    cardContent: {
        padding: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2563EB',
    },
    cardLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    badge: {
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        color: '#0369A1',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    radiusContainer: {
        flex: 2,
        marginLeft: 4,
        height: 52,
        justifyContent: 'center'
    },
    radiusChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    radiusChipSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB'
    },
    radiusText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600'
    },
    radiusTextSelected: {
        color: '#2563EB',
        fontWeight: '700'
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    textGreen: {
        color: '#059669',
    },
    textRed: {
        color: '#DC2626',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    clearBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2563EB',
        borderRadius: 12,
    },
    clearBtnText: {
        color: '#2563EB',
        fontWeight: '600',
    },
    // Map
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '70%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalItemSelected: {
        backgroundColor: '#F0F9FF',
    },
    modalItemText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    modalItemTextSelected: {
        color: '#2563EB',
        fontWeight: '700',
    },
    categoryGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    categoryBox: {
        width: 85,
        height: 80,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        position: 'relative',
        marginRight: 10,
    },
    categoryBoxActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
    },
    categoryIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    categoryIconCircleActive: {
        backgroundColor: '#2563EB',
    },
    categoryLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    categoryLabelActive: {
        color: '#2563EB',
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFF',
        borderRadius: 100,
        elevation: 2,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 65,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        maxHeight: 320,
        zIndex: 9999,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'visible',
        marginTop: 4, // Gap for Android shadows
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    suggestionName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827'
    },
    suggestionAddress: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2
    },
});

export default DashboardScreen;
