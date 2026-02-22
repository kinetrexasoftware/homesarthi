import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Platform,
    Dimensions,
    TextInput
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, MapPin, X, ChevronLeft, Plus, CheckCircle2, Trash2 } from 'lucide-react-native';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ROOM_TYPES, GENDER_PREFERENCES, AMENITIES, FURNISHING_TYPES, SHARING_TYPES } from '../constants';
import { compressImage } from '../utils/imageCompression';

const { width } = Dimensions.get('window');

const EditRoomScreen = ({ route, navigation }) => {
    const { room: initialRoom, roomId } = route.params || {};
    const [room, setRoom] = useState(initialRoom);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!initialRoom);
    const [locationLoading, setLocationLoading] = useState(false);
    const [newRule, setNewRule] = useState('');

    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [electricBill, setElectricBill] = useState(null);
    const [newElectricBill, setNewElectricBill] = useState(null);
    const [aadhaarCard, setAadhaarCard] = useState(null);
    const [newAadhaarCard, setNewAadhaarCard] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        contactNumber: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        latitude: '',
        longitude: '',
        rent: '',
        deposit: '',
        roomType: 'PG',
        genderPreference: 'any',
        furnishing: 'unfurnished',
        sharingType: 'private',
        rules: [],
        amenities: [],
        availabilityStatus: 'available',
        electricityBillIncluded: false,
        availableFrom: '',
    });

    useEffect(() => {
        if (!initialRoom && roomId) {
            fetchRoomDetails();
        } else if (room) {
            initializeForm(room);
        }
    }, [roomId, initialRoom]);

    const fetchRoomDetails = async () => {
        try {
            const { data } = await api.get(`/rooms/${roomId}`);
            if (data?.success) {
                const roomData = data.data;
                setRoom(roomData);
                initializeForm(roomData);
            }
        } catch (error) {
            console.error('Fetch room error:', error);
            Alert.alert('Error', 'Failed to load room details');
            navigation.goBack();
        } finally {
            setFetching(false);
        }
    };

    const initializeForm = (r) => {
        setImages(r.images || []);
        setElectricBill(r.verification?.electricBill || null);
        setAadhaarCard(r.verification?.aadhaarCard || null);
        setFormData({
            title: r.title || '',
            description: r.description || '',
            contactNumber: r.contactNumber || '',
            street: r.location?.address?.street || '',
            city: r.location?.address?.city || '',
            state: r.location?.address?.state || '',
            pincode: r.location?.address?.zipCode || '',
            latitude: r.location?.coordinates?.[1]?.toString() || '',
            longitude: r.location?.coordinates?.[0]?.toString() || '',
            rent: r.rent?.amount?.toString() || '',
            deposit: r.rent?.deposit?.toString() || '',
            roomType: r.roomType || 'PG',
            genderPreference: r.genderPreference || 'any',
            furnishing: r.furnishing || 'unfurnished',
            sharingType: r.sharingType || 'private',
            rules: r.rules || [],
            amenities: r.amenities || [],
            availabilityStatus: r.availability?.status || 'available',
            electricityBillIncluded: r.rent?.electricityBillIncluded || false,
            availableFrom: r.availability?.availableFrom ? new Date(r.availability.availableFrom).toISOString().split('T')[0] : '',
        });
        setFetching(false);
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

    const addRule = () => {
        if (!newRule.trim()) return;
        setFormData(prev => ({ ...prev, rules: [...prev.rules, newRule.trim()] }));
        setNewRule('');
    };

    const removeRule = (index) => {
        setFormData(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setLoading(true);
            try {
                if (images.length + newImages.length + result.assets.length > 5) {
                    Alert.alert('Limit Reached', 'Maximum 5 images allowed');
                    return;
                }
                const compressed = await Promise.all(
                    result.assets.map(async (asset) => {
                        const res = await compressImage(asset.uri);
                        return {
                            uri: res.uri,
                            name: res.uri.split('/').pop(),
                            type: 'image/jpeg'
                        };
                    })
                );
                setNewImages(prev => [...prev, ...compressed]);
            } catch (err) {
                Alert.alert('Error', 'Failed to process images');
            } finally {
                setLoading(false);
            }
        }
    };

    const pickElectricBill = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            setNewElectricBill({
                uri: asset.uri,
                name: asset.uri.split('/').pop(),
                type: 'image/jpeg'
            });
        }
    };

    const pickAadhaarCard = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            setNewAadhaarCard({
                uri: asset.uri,
                name: asset.uri.split('/').pop(),
                type: 'image/jpeg'
            });
        }
    };

    const removeImage = (index, isNew = false) => {
        if (isNew) {
            setNewImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setImages(prev => prev.filter((_, i) => i !== index));
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
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
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
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('roomType', formData.roomType);
            data.append('furnishing', formData.furnishing);
            data.append('sharingType', formData.sharingType);
            data.append('price', formData.rent);
            data.append('deposit', formData.deposit);
            data.append('longitude', formData.longitude);
            data.append('latitude', formData.latitude);
            data.append('city', formData.city);
            data.append('state', formData.state);
            data.append('street', formData.street);
            data.append('zipCode', formData.pincode);
            data.append('genderPreference', formData.genderPreference);
            data.append('contactNumber', formData.contactNumber);
            data.append('status', formData.availabilityStatus);
            data.append('electricityBillIncluded', formData.electricityBillIncluded.toString());
            data.append('availableFrom', formData.availableFrom);

            formData.rules.forEach(rule => data.append('rules', rule));
            formData.amenities.forEach(amenity => data.append('amenities', amenity));
            images.forEach(img => data.append('existingImages', JSON.stringify(img)));

            newImages.forEach((img, index) => {
                data.append('images', {
                    uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
                    name: img.name || `new_image_${index}.jpg`,
                    type: img.type || 'image/jpeg'
                });
            });

            if (newElectricBill) {
                data.append('electricBill', {
                    uri: Platform.OS === 'ios' ? newElectricBill.uri.replace('file://', '') : newElectricBill.uri,
                    name: newElectricBill.name || 'electric_bill.jpg',
                    type: newElectricBill.type || 'image/jpeg'
                });
            }

            if (newAadhaarCard) {
                data.append('aadhaarCard', {
                    uri: Platform.OS === 'ios' ? newAadhaarCard.uri.replace('file://', '') : newAadhaarCard.uri,
                    name: newAadhaarCard.name || 'aadhaar_card.jpg',
                    type: newAadhaarCard.type || 'image/jpeg'
                });
            }

            const response = await api.put(`/rooms/${room._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                Alert.alert('Success', 'Listing updated!', [
                    { text: 'OK', onPress: () => navigation.replace('MainTabs', { screen: 'OwnerDashboard' }) }
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update listing');
        } finally {
            setLoading(false);
        }
    };

    const renderSelector = (label, current, options, field) => (
        <View style={styles.selectorGroup}>
            <Text style={styles.descText}>{label}</Text>
            <View style={styles.optionGrid}>
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.optionItem, current === opt && styles.optionItemActive]}
                        onPress={() => handleChange(field, opt)}
                    >
                        <Text style={[styles.optionText, current === opt && styles.optionTextActive]}>
                            {opt === 'any' ? 'Any Gender' : opt}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (fetching) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 10, color: '#64748B' }}>Loading room data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Room</Text>
                <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color="#2563EB" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General Information</Text>
                    <Input label="Title *" value={formData.title} onChangeText={(v) => handleChange('title', v)} placeholder="Room Title" />
                    <Input label="Contact Number *" value={formData.contactNumber} onChangeText={(v) => handleChange('contactNumber', v)} keyboardType="phone-pad" />
                    <Input label="Description" multiline value={formData.description} onChangeText={(v) => handleChange('description', v)} numberOfLines={4} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>House Specifics</Text>
                    {renderSelector('Room Type', formData.roomType, ROOM_TYPES, 'roomType')}
                    {renderSelector('Sharing Type', formData.sharingType, SHARING_TYPES, 'sharingType')}
                    {renderSelector('Furnishing', formData.furnishing, FURNISHING_TYPES, 'furnishing')}
                    {renderSelector('Gender Preference', formData.genderPreference, GENDER_PREFERENCES, 'genderPreference')}
                    {renderSelector('Availability', formData.availabilityStatus, ['available', 'occupied', 'maintenance'], 'availabilityStatus')}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pricing</Text>
                    <View style={styles.row}>
                        <Input label="Monthly Rent (₹) *" style={{ flex: 1, marginRight: 8 }} value={formData.rent} onChangeText={(v) => handleChange('rent', v)} keyboardType="numeric" />
                        <Input label="Deposit (₹) *" style={{ flex: 1 }} value={formData.deposit} onChangeText={(v) => handleChange('deposit', v)} keyboardType="numeric" />
                    </View>
                    <View style={[styles.row, { marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }]}>
                        <Text style={styles.descText}>Electricity Bill Included?</Text>
                        <TouchableOpacity
                            style={[styles.optionItem, formData.electricityBillIncluded && styles.optionItemActive]}
                            onPress={() => handleChange('electricityBillIncluded', !formData.electricityBillIncluded)}
                        >
                            <Text style={[styles.optionText, formData.electricityBillIncluded && styles.optionTextActive]}>
                                {formData.electricityBillIncluded ? 'YES' : 'NO'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Input
                        label="Available From"
                        placeholder="YYYY-MM-DD"
                        value={formData.availableFrom}
                        onChangeText={(v) => handleChange('availableFrom', v)}
                        style={{ marginTop: 10 }}
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Location Details</Text>
                        <TouchableOpacity onPress={getCurrentLocation} disabled={locationLoading} style={styles.locationBtn}>
                            {locationLoading ? <ActivityIndicator size="small" color="#2563EB" /> : <><MapPin size={16} color="#2563EB" /><Text style={styles.locationBtnText}>Detect</Text></>}
                        </TouchableOpacity>
                    </View>
                    <Input label="Address / Street *" value={formData.street} onChangeText={(v) => handleChange('street', v)} />
                    <View style={styles.row}>
                        <Input label="City *" style={{ flex: 1, marginRight: 8 }} value={formData.city} onChangeText={(v) => handleChange('city', v)} />
                        <Input label="State *" style={{ flex: 1 }} value={formData.state} onChangeText={(v) => handleChange('state', v)} />
                    </View>
                    <Input label="Pincode *" value={formData.pincode} onChangeText={(v) => handleChange('pincode', v)} keyboardType="numeric" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>House Rules</Text>
                    <View style={styles.ruleInputRow}>
                        <TextInput
                            style={styles.ruleInput}
                            placeholder="Add a house rule (e.g. No smoking)"
                            value={newRule}
                            onChangeText={setNewRule}
                        />
                        <TouchableOpacity style={styles.addRuleBtn} onPress={addRule}>
                            <Plus size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.rulesList}>
                        {formData.rules.map((rule, idx) => (
                            <View key={idx} style={styles.ruleItem}>
                                <Text style={styles.ruleText}>{rule}</Text>
                                <TouchableOpacity onPress={() => removeRule(idx)}>
                                    <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Amenities</Text>
                    <View style={styles.amenityGrid}>
                        {AMENITIES.map((amt) => {
                            const active = formData.amenities.includes(amt.value);
                            return (
                                <TouchableOpacity
                                    key={amt.value}
                                    style={[styles.amenityItem, active && styles.amenityItemActive]}
                                    onPress={() => toggleAmenity(amt.value)}
                                >
                                    <Text style={styles.amenityIcon}>{amt.icon}</Text>
                                    <Text style={[styles.amenityLabel, active && styles.amenityLabelActive]}>{amt.label}</Text>
                                    {active && <CheckCircle2 size={12} color="#2563EB" style={styles.checkIcon} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Images ({images.length + newImages.length}/5)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                        {images.map((img, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri: img.url }} style={styles.photo} />
                                <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(index)}><X size={12} color="#fff" /></TouchableOpacity>
                            </View>
                        ))}
                        {newImages.map((img, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri: img.uri }} style={[styles.photo, styles.photoNew]} />
                                <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(index, true)}><X size={12} color="#fff" /></TouchableOpacity>
                            </View>
                        ))}
                        {(images.length + newImages.length < 5) && (
                            <TouchableOpacity style={styles.addSquare} onPress={pickImage}>
                                <Plus size={28} color="#94A3B8" />
                                <Text style={styles.addText}>Add</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Legal Verification</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.descText}>Electric Bill</Text>
                            <TouchableOpacity style={[styles.docPicker, (electricBill || newElectricBill) && styles.docActive]} onPress={pickElectricBill}>
                                {newElectricBill ? <Image source={{ uri: newElectricBill.uri }} style={styles.docPreview} /> : electricBill ? <Image source={{ uri: electricBill.url }} style={styles.docPreview} /> : <Camera size={24} color="#94A3B8" />}
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.descText}>Aadhaar Card</Text>
                            <TouchableOpacity style={[styles.docPicker, (aadhaarCard || newAadhaarCard) && styles.docActive]} onPress={pickAadhaarCard}>
                                {newAadhaarCard ? <Image source={{ uri: newAadhaarCard.uri }} style={styles.docPreview} /> : aadhaarCard ? <Image source={{ uri: aadhaarCard.url }} style={styles.docPreview} /> : <Camera size={24} color="#94A3B8" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <Button title="Save Changes" onPress={handleSubmit} loading={loading} style={{ marginVertical: 20 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    saveText: { color: '#2563EB', fontWeight: '800', fontSize: 16 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
    section: { marginBottom: 24, backgroundColor: '#FFF', padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    locationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
    locationBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
    selectorGroup: { marginBottom: 16 },
    descText: { fontSize: 13, color: '#64748B', fontWeight: '700', marginBottom: 10 },
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    optionItemActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
    optionText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    optionTextActive: { color: '#2563EB', fontWeight: '800' },
    ruleInputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    ruleInput: { flex: 1, height: 46, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 15, fontSize: 14 },
    addRuleBtn: { width: 46, height: 46, backgroundColor: '#2563EB', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    rulesList: { gap: 8 },
    ruleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    ruleText: { fontSize: 14, color: '#334155', flex: 1 },
    amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    amenityItem: { width: (width - 104) / 3, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
    amenityItemActive: { backgroundColor: '#FFFFFF', borderColor: '#2563EB', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    amenityIcon: { fontSize: 20, marginBottom: 4 },
    amenityLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'center' },
    amenityLabelActive: { color: '#2563EB', fontWeight: '800' },
    checkIcon: { position: 'absolute', top: 5, right: 5 },
    imageWrapper: { marginRight: 12, position: 'relative' },
    photo: { width: 100, height: 100, borderRadius: 12 },
    photoNew: { borderColor: '#10B981', borderWidth: 2 },
    removeIcon: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 12, padding: 4 },
    addSquare: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
    addText: { fontSize: 12, color: '#94A3B8', fontWeight: '700', marginTop: 4 },
    docPicker: { height: 100, backgroundColor: '#F8FAFC', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    docActive: { borderColor: '#10B981', borderStyle: 'solid' },
    docPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
});

export default EditRoomScreen;
