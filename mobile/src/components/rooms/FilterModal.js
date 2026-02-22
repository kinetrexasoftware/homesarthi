import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput
} from 'react-native';
import { X } from 'lucide-react-native';
import { ROOM_TYPES, GENDER_PREFERENCES, AMENITIES, FURNISHING_TYPES } from '../../constants';
import Button from '../common/Button';

const FilterModal = ({ visible, onClose, filters, onApply, onReset }) => {
    const [tempFilters, setTempFilters] = useState(filters);

    const handleApply = () => {
        onApply(tempFilters);
        onClose();
    };

    const toggleAmenity = (value) => {
        setTempFilters(prev => ({
            ...prev,
            amenities: prev.amenities.includes(value)
                ? prev.amenities.filter(a => a !== value)
                : [...prev.amenities, value]
        }));
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Filters</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Price Range (Monthly)</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min (₹)"
                                    keyboardType="numeric"
                                    value={tempFilters.minRent}
                                    onChangeText={(v) => setTempFilters({ ...tempFilters, minRent: v })}
                                />
                                <View style={{ width: 12 }} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Max (₹)"
                                    keyboardType="numeric"
                                    value={tempFilters.maxRent}
                                    onChangeText={(v) => setTempFilters({ ...tempFilters, maxRent: v })}
                                />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Room Type</Text>
                            <View style={styles.chipContainer}>
                                {ROOM_TYPES.map(type => {
                                    const isSelected = tempFilters.roomTypes?.includes(type);
                                    return (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.chip, isSelected && styles.chipActive]}
                                            onPress={() => {
                                                const newTypes = isSelected
                                                    ? tempFilters.roomTypes.filter(t => t !== type)
                                                    : [...(tempFilters.roomTypes || []), type];
                                                setTempFilters({ ...tempFilters, roomTypes: newTypes });
                                            }}
                                        >
                                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                                {type.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Gender Preference</Text>
                            <View style={styles.chipContainer}>
                                {GENDER_PREFERENCES.map(gender => (
                                    <TouchableOpacity
                                        key={gender}
                                        style={[styles.chip, tempFilters.genderPreference === gender && styles.chipActive]}
                                        onPress={() => setTempFilters({ ...tempFilters, genderPreference: gender })}
                                    >
                                        <Text style={[styles.chipText, tempFilters.genderPreference === gender && styles.chipTextActive]}>
                                            {gender.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Furnishing</Text>
                            <View style={styles.chipContainer}>
                                {FURNISHING_TYPES.map(furnishing => {
                                    const isSelected = tempFilters.furnishing?.includes(furnishing);
                                    return (
                                        <TouchableOpacity
                                            key={furnishing}
                                            style={[styles.chip, isSelected && styles.chipActive]}
                                            onPress={() => {
                                                const newFurnishing = isSelected
                                                    ? tempFilters.furnishing.filter(f => f !== furnishing)
                                                    : [...(tempFilters.furnishing || []), furnishing];
                                                setTempFilters({ ...tempFilters, furnishing: newFurnishing });
                                            }}
                                        >
                                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                                {furnishing.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Electricity Bill Included</Text>
                            <View style={styles.chipContainer}>
                                {[
                                    { label: 'All', value: 'all' },
                                    { label: 'Yes', value: 'true' },
                                    { label: 'No', value: 'false' }
                                ].map(option => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.chip, tempFilters.electricityBillIncluded === option.value && styles.chipActive]}
                                        onPress={() => setTempFilters({ ...tempFilters, electricityBillIncluded: option.value })}
                                    >
                                        <Text style={[styles.chipText, tempFilters.electricityBillIncluded === option.value && styles.chipTextActive]}>
                                            {option.label.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Amenities</Text>
                            <View style={styles.amenitiesGrid}>
                                {AMENITIES.map(item => (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[
                                            styles.amenityCard,
                                            tempFilters.amenities.includes(item.value) && styles.amenityCardActive
                                        ]}
                                        onPress={() => toggleAmenity(item.value)}
                                    >
                                        <Text style={styles.amenityIcon}>{item.icon}</Text>
                                        <Text style={[
                                            styles.amenityLabel,
                                            tempFilters.amenities.includes(item.value) && styles.amenityLabelActive
                                        ]}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.resetButton} onPress={() => setTempFilters({
                            minRent: '',
                            maxRent: '',
                            roomTypes: [],
                            amenities: [],
                            genderPreference: '',
                            furnishing: [],
                            electricityBillIncluded: 'all'
                        })}>
                            <Text style={styles.resetText}>Reset All</Text>
                        </TouchableOpacity>
                        <Button title="Apply Filters" style={{ flex: 1 }} onPress={handleApply} />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    body: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    input: {
        flex: 1,
        height: 48,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    chipActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    chipTextActive: {
        color: '#2563EB',
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    amenityCard: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    amenityCardActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
    },
    amenityIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    amenityLabel: {
        fontSize: 10,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
    },
    amenityLabelActive: {
        color: '#2563EB',
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 16,
    },
    resetButton: {
        paddingVertical: 12,
    },
    resetText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 14,
    }
});

export default FilterModal;
