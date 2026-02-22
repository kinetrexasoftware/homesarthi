import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
    Camera, MapPin, X, ChevronLeft, Plus, Navigation,
    Info, Eye, IndianRupee, Sparkles, Image as ImageIcon,
    FileText, CheckCircle, ChevronRight, Check, AlertCircle, Edit3
} from 'lucide-react-native';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ROOM_TYPES, GENDER_PREFERENCES, AMENITIES, FURNISHING_TYPES } from '../constants';
import { compressImage } from '../utils/imageCompression';

const CreateRoomScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [electricBill, setElectricBill] = useState(null);
    const [aadhaarCard, setAadhaarCard] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        contactNumber: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        latitude: '',
        longitude: '',
        exactLatitude: '',
        exactLongitude: '',
        locationVisibility: 'approximate',
        rent: '',
        deposit: '',
        roomType: 'PG',
        genderPreference: 'any',
        furnishing: 'unfurnished',
        electricityBillIncluded: false,
        availableFrom: new Date().toISOString().split('T')[0],
        amenities: [],
        availabilityStatus: 'available',
        rules: [],
    });

    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        { title: 'Basic', icon: Info },
        { title: 'Location', icon: MapPin },
        { title: 'Privacy', icon: Eye },
        { title: 'Pricing', icon: IndianRupee },
        { title: 'Amenities', icon: Sparkles },
        { title: 'Photos', icon: ImageIcon },
        { title: 'Verification', icon: FileText },
        { title: 'Review', icon: CheckCircle },
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleAmenity = (value) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(value)
                ? prev.amenities.filter(a => a !== value)
                : [...prev.amenities, value]
        }));
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to upload photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.7,
            selectionLimit: 5 - images.length
        });

        if (!result.canceled) {
            setLoading(true);
            try {
                const compressedImages = await Promise.all(
                    result.assets.map(async (asset) => {
                        const compressed = await compressImage(asset.uri, { maxWidth: 1000, quality: 0.6 });
                        return {
                            uri: compressed.uri,
                            name: compressed.uri.split('/').pop(),
                            type: 'image/jpeg'
                        };
                    })
                );
                setImages(prev => [...prev, ...compressedImages]);
            } catch (error) {
                console.error('Compression error:', error);
                Alert.alert('Error', 'Failed to compress images');
            } finally {
                setLoading(false);
            }
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const pickElectricBill = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const compressed = await compressImage(asset.uri, { maxWidth: 1000, quality: 0.6 });
            setElectricBill({
                uri: compressed.uri,
                name: compressed.uri.split('/').pop(),
                type: 'image/jpeg'
            });
        }
    };

    const pickAadhaarCard = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const compressed = await compressImage(asset.uri, { maxWidth: 1000, quality: 0.6 });
            setAadhaarCard({
                uri: compressed.uri,
                name: compressed.uri.split('/').pop(),
                type: 'image/jpeg'
            });
        }
    };

    const getCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
                timeout: 15000,
            });
            const { latitude, longitude } = location.coords;

            setFormData(prev => ({
                ...prev,
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6)
            }));

            // Reverse geocode
            const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (reverse.length > 0) {
                const addr = reverse[0];
                setFormData(prev => ({
                    ...prev,
                    street: addr.street || addr.name || prev.street,
                    city: addr.city || addr.district || prev.city,
                    state: addr.region || prev.state,
                    pincode: addr.postalCode || prev.pincode,
                }));
            }
            Alert.alert('Success', 'Location captured and address auto-filled!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to get location');
        } finally {
            setLocationLoading(false);
        }
    };

    const getExactLocation = async () => {
        setLocationLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
                timeout: 15000,
            });
            const { latitude, longitude } = location.coords;

            setFormData(prev => ({
                ...prev,
                exactLatitude: latitude.toFixed(6),
                exactLongitude: longitude.toFixed(6),
                locationVisibility: 'exact'
            }));

            Alert.alert('Success', 'Exact location captured for approved students!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to get exact location');
        } finally {
            setLocationLoading(false);
        }
    };

    const validate = () => {
        if (!formData.title || !formData.rent || !formData.street || !formData.contactNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return false;
        }
        if (images.length === 0) {
            Alert.alert('Error', 'Please upload at least 1 image (Max 5)');
            return false;
        }
        if (images.length > 5) {
            Alert.alert('Error', 'Maximum 5 images allowed');
            return false;
        }
        if (!electricBill) {
            Alert.alert('Error', 'Electric bill is mandatory for verification');
            return false;
        }
        if (!aadhaarCard) {
            Alert.alert('Error', 'Aadhaar card is mandatory for verification');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            // Obfuscation logic for privacy
            let finalLat = parseFloat(formData.latitude);
            let finalLng = parseFloat(formData.longitude);

            if (formData.locationVisibility === 'approximate') {
                // Add random offset of roughly 200-400 meters for privacy
                const latOffset = (Math.random() * 0.004 - 0.002);
                const lngOffset = (Math.random() * 0.004 - 0.002);
                finalLat += latOffset;
                finalLng += lngOffset;
            }

            const data = new FormData();

            // Append basic fields
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('roomType', formData.roomType);
            data.append('price', formData.rent);
            data.append('deposit', formData.deposit);
            data.append('longitude', finalLng.toString());
            data.append('latitude', finalLat.toString());
            data.append('city', formData.city);
            data.append('state', formData.state);
            data.append('street', formData.street);
            data.append('zipCode', formData.pincode);
            data.append('landmark', formData.landmark);
            data.append('genderPreference', formData.genderPreference);
            data.append('contactNumber', formData.contactNumber);
            data.append('availability.status', formData.availabilityStatus);
            data.append('locationVisibility', formData.locationVisibility);
            data.append('furnishing', formData.furnishing);
            data.append('rent.electricityBillIncluded', formData.electricityBillIncluded.toString());
            data.append('availability.availableFrom', formData.availableFrom);

            // Exact location for approved students
            if (formData.exactLatitude && formData.exactLongitude) {
                data.append('exactLatitude', formData.exactLatitude);
                data.append('exactLongitude', formData.exactLongitude);
            } else {
                data.append('exactLatitude', formData.latitude);
                data.append('exactLongitude', formData.longitude);
            }

            formData.amenities.forEach(amenity => {
                data.append('amenities', amenity);
            });

            // Append images (Max 5)
            images.slice(0, 5).forEach((img, index) => {
                data.append('images', {
                    uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
                    name: img.name || `image_${index}.jpg`,
                    type: img.type || 'image/jpeg'
                });
            });

            // Append Electric Bill
            if (electricBill) {
                data.append('electricBill', {
                    uri: Platform.OS === 'ios' ? electricBill.uri.replace('file://', '') : electricBill.uri,
                    name: electricBill.name || 'electric_bill.jpg',
                    type: electricBill.type || 'image/jpeg'
                });
            }

            // Append Aadhaar Card
            if (aadhaarCard) {
                data.append('aadhaarCard', {
                    uri: Platform.OS === 'ios' ? aadhaarCard.uri.replace('file://', '') : aadhaarCard.uri,
                    name: aadhaarCard.name || 'aadhaar_card.jpg',
                    type: aadhaarCard.type || 'image/jpeg'
                });
            }

            const response = await api.post('/rooms', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                Alert.alert('Success', 'Room listing created! Awaiting admin approval.', [
                    { text: 'OK', onPress: () => navigation.replace('MainTabs') }
                ]);
            }
        } catch (error) {
            console.error('Create room error:', error.response?.data || error.message);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create room listing');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Details</Text>
                        <Input
                            label="Property Title *"
                            placeholder="e.g. Luxury Single Room near Metro"
                            value={formData.title}
                            onChangeText={(v) => handleChange('title', v)}
                        />
                        <Input
                            label="Contact Number *"
                            placeholder="e.g. +91 9876543210"
                            keyboardType="phone-pad"
                            value={formData.contactNumber}
                            onChangeText={(v) => handleChange('contactNumber', v)}
                        />
                        <Input
                            label="Description"
                            placeholder="Describe your property..."
                            multiline
                            numberOfLines={4}
                            style={{ height: 120, textAlignVertical: 'top' }}
                            value={formData.description}
                            onChangeText={(v) => handleChange('description', v)}
                        />
                    </View>
                );
            case 1:
                return (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Location Information</Text>
                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={getCurrentLocation}
                                disabled={locationLoading}
                            >
                                {locationLoading ? (
                                    <ActivityIndicator size="small" color="#2563EB" />
                                ) : (
                                    <MapPin size={18} color="#2563EB" />
                                )}
                                <Text style={styles.locationButtonText}>Get Location</Text>
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Street Address *"
                            placeholder="Street, Area, etc."
                            value={formData.street}
                            onChangeText={(v) => handleChange('street', v)}
                        />
                        <View style={styles.row}>
                            <Input
                                label="City *"
                                style={{ flex: 1, marginRight: 8 }}
                                value={formData.city}
                                onChangeText={(v) => handleChange('city', v)}
                            />
                            <Input
                                label="State *"
                                style={{ flex: 1 }}
                                value={formData.state}
                                onChangeText={(v) => handleChange('state', v)}
                            />
                        </View>
                        <Input
                            label="Pincode *"
                            placeholder="6-digit code"
                            keyboardType="numeric"
                            value={formData.pincode}
                            onChangeText={(v) => handleChange('pincode', v)}
                        />
                        <View style={styles.row}>
                            <Input
                                label="Lat"
                                style={{ flex: 1, marginRight: 8 }}
                                value={formData.latitude}
                                editable={false}
                            />
                            <Input
                                label="Lng"
                                style={{ flex: 1 }}
                                value={formData.longitude}
                                editable={false}
                            />
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Privacy Controls</Text>
                        <View style={styles.privacySection}>
                            <Text style={styles.privacyTitle}>📍 Sharing Options</Text>
                            <Text style={styles.privacySubtitle}>Choose how your location is shared</Text>

                            <View style={styles.privacyOptions}>
                                <TouchableOpacity
                                    style={[
                                        styles.privacyCard,
                                        formData.locationVisibility === 'approximate' && styles.privacyCardActive
                                    ]}
                                    onPress={() => handleChange('locationVisibility', 'approximate')}
                                >
                                    <View style={styles.privacyCardHeader}>
                                        <Text style={[
                                            styles.privacyCardLabel,
                                            formData.locationVisibility === 'approximate' && styles.privacyCardLabelActive
                                        ]}>BROAD</Text>
                                    </View>
                                    <Text style={styles.privacyCardTitle}>Approximate</Text>
                                    <Text style={styles.privacyCardDesc}>Shows neighborhood</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.privacyCard,
                                        formData.locationVisibility === 'exact' && styles.privacyCardActive
                                    ]}
                                    onPress={() => handleChange('locationVisibility', 'exact')}
                                >
                                    <View style={styles.privacyCardHeader}>
                                        <Text style={[
                                            styles.privacyCardLabel,
                                            formData.locationVisibility === 'exact' && styles.privacyCardLabelActive
                                        ]}>DIRECT</Text>
                                    </View>
                                    <Text style={styles.privacyCardTitle}>Exact Spot</Text>
                                    <Text style={styles.privacyCardDesc}>Doorstep pin-point</Text>
                                </TouchableOpacity>
                            </View>

                            {formData.locationVisibility === 'exact' && (
                                <View style={styles.exactLocationSection}>
                                    <TouchableOpacity
                                        style={styles.exactLocationButton}
                                        onPress={getExactLocation}
                                        disabled={locationLoading}
                                    >
                                        {locationLoading ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Navigation size={18} color="#FFFFFF" />
                                                <Text style={styles.exactLocationButtonText}>Capture GPS</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    {formData.exactLatitude && (
                                        <Text style={styles.exactLocationNote}>✓ Exact location captured</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pricing & Preferences</Text>
                        <View style={styles.row}>
                            <Input
                                label="Rent *"
                                style={{ flex: 1, marginRight: 8 }}
                                keyboardType="numeric"
                                value={formData.rent}
                                onChangeText={(v) => handleChange('rent', v)}
                            />
                            <Input
                                label="Deposit *"
                                style={{ flex: 1 }}
                                keyboardType="numeric"
                                value={formData.deposit}
                                onChangeText={(v) => handleChange('deposit', v)}
                            />
                        </View>

                        <Text style={styles.subLabel}>Room Type *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectionRow}>
                            {ROOM_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.chip, formData.roomType === type && styles.chipActive]}
                                    onPress={() => handleChange('roomType', type)}
                                >
                                    <Text style={[styles.chipText, formData.roomType === type && styles.chipTextActive]}>
                                        {type.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.subLabel}>Furnishing *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectionRow}>
                            {FURNISHING_TYPES.map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.chip, formData.furnishing === f && styles.chipActive]}
                                    onPress={() => handleChange('furnishing', f)}
                                >
                                    <Text style={[styles.chipText, formData.furnishing === f && styles.chipTextActive]}>
                                        {f.replace('-', ' ').toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={[styles.row, { marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }]}>
                            <Text style={styles.subLabel}>Electricity Bill Included?</Text>
                            <TouchableOpacity
                                style={[styles.chip, formData.electricityBillIncluded && styles.chipActive]}
                                onPress={() => handleChange('electricityBillIncluded', !formData.electricityBillIncluded)}
                            >
                                <Text style={[styles.chipText, formData.electricityBillIncluded && styles.chipTextActive]}>
                                    {formData.electricityBillIncluded ? 'YES' : 'NO'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.subLabel, { marginTop: 10 }]}>Gender Preference *</Text>
                        <View style={styles.selectionRow}>
                            {GENDER_PREFERENCES.map(gender => (
                                <TouchableOpacity
                                    key={gender}
                                    style={[styles.chip, formData.genderPreference === gender && styles.chipActive]}
                                    onPress={() => handleChange('genderPreference', gender)}
                                >
                                    <Text style={[styles.chipText, formData.genderPreference === gender && styles.chipTextActive]}>
                                        {gender.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.subLabel, { marginTop: 10 }]}>Available From</Text>
                        <Input
                            placeholder="YYYY-MM-DD"
                            value={formData.availableFrom}
                            onChangeText={(v) => handleChange('availableFrom', v)}
                        />
                    </View>
                );
            case 4:
                return (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Amenities</Text>
                        <View style={styles.amenitiesGrid}>
                            {AMENITIES.map(item => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.amenityCard,
                                        formData.amenities.includes(item.value) && styles.amenityCardActive
                                    ]}
                                    onPress={() => toggleAmenity(item.value)}
                                >
                                    <Text style={styles.amenityIcon}>{item.icon}</Text>
                                    <Text style={[
                                        styles.amenityLabel,
                                        formData.amenities.includes(item.value) && styles.amenityLabelActive
                                    ]}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 5:
                return (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Photos ({images.length}/5)</Text>
                        </View>
                        <Text style={styles.description}>Add 1 thumbnail (first photo) and up to 4 room images.</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                            <TouchableOpacity style={styles.addSquare} onPress={pickImage}>
                                <Plus size={32} color="#9CA3AF" />
                                <Text style={styles.addSquareText}>Add Photo</Text>
                            </TouchableOpacity>
                            {images.map((img, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri: img.uri }} style={styles.photo} />
                                    <TouchableOpacity
                                        style={styles.removeIcon}
                                        onPress={() => removeImage(index)}
                                    >
                                        <X size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                );
            case 6:
                return (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Verification & Policies</Text>

                        <Text style={styles.subLabel}>Electric Bill *</Text>
                        <TouchableOpacity
                            style={[
                                styles.documentPicker,
                                electricBill && styles.documentPickerActive,
                                { height: 110, marginBottom: 15 }
                            ]}
                            onPress={pickElectricBill}
                        >
                            {electricBill ? (
                                <View style={styles.documentPreview}>
                                    <Image source={{ uri: electricBill.uri }} style={styles.docImage} />
                                    <View style={styles.docInfo}>
                                        <Text style={styles.docName}>Electric Bill Attached ✓</Text>
                                        <Text style={styles.docSize}>Tap to change</Text>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <FileText size={24} color="#9CA3AF" />
                                    <Text style={styles.documentPickerText}>Upload Electric Bill</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.subLabel}>Aadhaar Card *</Text>
                        <TouchableOpacity
                            style={[
                                styles.documentPicker,
                                aadhaarCard && styles.documentPickerActive,
                                { height: 110 }
                            ]}
                            onPress={pickAadhaarCard}
                        >
                            {aadhaarCard ? (
                                <View style={styles.documentPreview}>
                                    <Image source={{ uri: aadhaarCard.uri }} style={styles.docImage} />
                                    <View style={styles.docInfo}>
                                        <Text style={styles.docName}>Aadhaar Card Attached ✓</Text>
                                        <Text style={styles.docSize}>Tap to change</Text>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <FileText size={24} color="#9CA3AF" />
                                    <Text style={styles.documentPickerText}>Upload Aadhaar Card</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.subLabel}>House Rules</Text>
                        <Input
                            placeholder="Add house rules (one per line)..."
                            multiline
                            numberOfLines={4}
                            style={{ height: 120, textAlignVertical: 'top' }}
                            value={formData.rules.join('\n')}
                            onChangeText={(v) => handleChange('rules', v.split('\n'))}
                        />
                    </View>
                );
            case 7:
                return (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Review Your Listing</Text>

                        <View style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewStepTitle}>Basic Details</Text>
                                <TouchableOpacity onPress={() => setCurrentStep(0)}><Edit3 size={18} color="#2563EB" /></TouchableOpacity>
                            </View>
                            <Text style={styles.reviewText}><Text style={styles.bold}>Category:</Text> {formData.roomType.toUpperCase()}</Text>
                            <Text style={styles.reviewText}><Text style={styles.bold}>Title:</Text> {formData.title}</Text>
                            <Text style={styles.reviewText}><Text style={styles.bold}>Contact:</Text> {formData.contactNumber}</Text>
                        </View>

                        <View style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewStepTitle}>Location</Text>
                                <TouchableOpacity onPress={() => setCurrentStep(1)}><Edit3 size={18} color="#2563EB" /></TouchableOpacity>
                            </View>
                            <Text style={styles.reviewText}>{formData.street}, {formData.city}, {formData.state}</Text>
                            <View style={[styles.chip, { backgroundColor: '#EFF6FF', borderColor: '#2563EB', marginTop: 8, width: 100 }]}>
                                <Text style={[styles.chipText, { color: '#2563EB' }]}>{formData.locationVisibility.toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewStepTitle}>Pricing & Info</Text>
                                <TouchableOpacity onPress={() => setCurrentStep(3)}><Edit3 size={18} color="#2563EB" /></TouchableOpacity>
                            </View>
                            <View style={styles.row}>
                                <Text style={[styles.reviewText, { flex: 1 }]}><Text style={styles.bold}>Rent:</Text> ₹{formData.rent}</Text>
                                <Text style={[styles.reviewText, { flex: 1 }]}><Text style={styles.bold}>Deposit:</Text> ₹{formData.deposit}</Text>
                            </View>
                        </View>

                        <View style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewStepTitle}>Photos & Verification</Text>
                                <TouchableOpacity onPress={() => setCurrentStep(5)}><Edit3 size={18} color="#2563EB" /></TouchableOpacity>
                            </View>
                            <Text style={styles.reviewText}><Text style={styles.bold}>Photos:</Text> {images.length}/5 uploaded</Text>
                            <Text style={styles.reviewText}><Text style={styles.bold}>Electric Bill:</Text> {electricBill ? 'Uploaded' : 'Missing'}</Text>
                            <Text style={styles.reviewText}><Text style={styles.bold}>Amenities:</Text> {formData.amenities.length} selected</Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => currentStep > 0 ? prevStep() : navigation.goBack()}>
                    <ChevronLeft size={28} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{steps[currentStep].title}</Text>
                    <Text style={styles.headerSubtitle}>Step {currentStep + 1} of {steps.length}</Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            {/* Stepper Navigation */}
            <View style={styles.stepperContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepperContent}>
                    {steps.map((step, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => index < currentStep && setCurrentStep(index)}
                            style={[styles.stepItem, currentStep === index && styles.stepItemActive]}
                        >
                            <View style={[styles.stepIconContainer, currentStep === index && styles.stepIconActive, index < currentStep && styles.stepIconCompleted]}>
                                {index < currentStep ? <Check size={14} color="#FFFFFF" strokeWidth={4} /> : <step.icon size={14} color={currentStep === index ? '#FFFFFF' : '#9CA3AF'} />}
                            </View>
                            <Text style={[styles.stepTitle, currentStep === index && styles.stepTitleActive]}>{step.title}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {renderStepContent()}
            </ScrollView>

            <View style={styles.navigationFooter}>
                <TouchableOpacity
                    style={[styles.navButton, styles.navButtonPrev, currentStep === 0 && styles.navButtonDisabled]}
                    onPress={prevStep}
                    disabled={currentStep === 0}
                >
                    <ChevronLeft size={20} color={currentStep === 0 ? '#CBD5E1' : '#64748B'} />
                    <Text style={[styles.navButtonText, { color: currentStep === 0 ? '#CBD5E1' : '#64748B' }]}>Previous</Text>
                </TouchableOpacity>

                {currentStep < steps.length - 1 ? (
                    <TouchableOpacity style={[styles.navButton, styles.navButtonNext]} onPress={nextStep}>
                        <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>Continue</Text>
                        <ChevronRight size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.navButton, styles.navButtonSubmit]} onPress={handleSubmit} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>Submit</Text>
                                <CheckCircle size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    stepperContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    stepperContent: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        gap: 15,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    stepItemActive: {
        backgroundColor: '#EFF6FF',
    },
    stepIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIconActive: {
        backgroundColor: '#2563EB',
    },
    stepIconCompleted: {
        backgroundColor: '#10B981',
    },
    stepTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    stepTitleActive: {
        color: '#2563EB',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 20,
        letterSpacing: -0.8,
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 12,
        marginTop: 16,
    },
    row: {
        flexDirection: 'row',
    },
    selectionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    chipActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
    },
    chipTextActive: {
        color: '#2563EB',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    locationButtonText: {
        color: '#2563EB',
        fontWeight: '800',
        marginLeft: 6,
        fontSize: 12,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    amenityCard: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    amenityCardActive: {
        backgroundColor: '#F0F9FF',
        borderColor: '#2563EB',
    },
    amenityIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    amenityLabel: {
        fontSize: 10,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    amenityLabelActive: {
        color: '#2563EB',
    },
    imagesScroll: {
        flexDirection: 'row',
    },
    addSquare: {
        width: 120,
        height: 120,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    addSquareText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 6,
        fontWeight: '800',
    },
    imageWrapper: {
        marginRight: 15,
        position: 'relative',
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 24,
    },
    removeIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#EF4444',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    privacySection: {
        marginTop: 10,
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    privacyTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    privacySubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 20,
    },
    privacyOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    privacyCard: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    privacyCardActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    privacyCardHeader: {
        marginBottom: 8,
    },
    privacyCardLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    privacyCardLabelActive: {
        color: '#2563EB',
    },
    privacyCardTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    privacyCardDesc: {
        fontSize: 10,
        color: '#64748B',
        lineHeight: 14,
        fontWeight: '600',
    },
    exactLocationSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    exactLocationButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    exactLocationButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    exactLocationNote: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '800',
        marginTop: 12,
        textAlign: 'center',
    },
    navigationFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 20,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 20,
    },
    navButton: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    navButtonPrev: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    navButtonNext: {
        backgroundColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    navButtonSubmit: {
        backgroundColor: '#0F172A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    navButtonDisabled: {
        backgroundColor: '#F8FAFC',
        borderColor: '#F1F5F9',
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    reviewStepTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    reviewText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
        fontWeight: '600',
    },
    bold: {
        fontWeight: '900',
        color: '#334155',
    },
    description: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 20,
        fontWeight: '600',
    },
    documentPicker: {
        height: 180,
        backgroundColor: '#F8FAFC',
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    documentPickerActive: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
        borderStyle: 'solid',
    },
    documentPickerText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginTop: 12,
    },
    documentPickerSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        marginTop: 4,
    },
    documentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 15,
        width: '100%',
    },
    docImage: {
        width: 80,
        height: 80,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    docInfo: {
        flex: 1,
    },
    docName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#065F46',
    },
    docSize: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '700',
        marginTop: 2,
    }
});

export default CreateRoomScreen;
