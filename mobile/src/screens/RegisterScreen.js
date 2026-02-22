import React, { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
    Modal,
    FlatList,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, Phone, School, ChevronLeft, ArrowRight, MapPin, GraduationCap, Home, X, Search, ChevronDown } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { getStates, getCities } from '../constants/indianCities';

WebBrowser.maybeCompleteAuthSession();

// --- Custom Searchable Picker Component ---
const SearchablePicker = ({
    label,
    value,
    onSelect,
    options = [],
    placeholder,
    disabled,
    icon: Icon
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);

    useEffect(() => {
        setFilteredOptions(
            options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery, options]);

    useEffect(() => {
        if (modalVisible) setSearchQuery('');
    }, [modalVisible]);

    const handleSelect = (item) => {
        onSelect(item);
        setModalVisible(false);
    };

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                onPress={() => !disabled && setModalVisible(true)}
                activeOpacity={0.7}
                style={[styles.pickerTrigger, disabled && styles.disabledPicker]}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {Icon && <Icon size={18} color={disabled ? "#D1D5DB" : "#9CA3AF"} style={styles.inputIcon} />}
                    <Text style={[styles.pickerText, !value && styles.placeholderText, disabled && styles.disabledText]}>
                        {value || placeholder}
                    </Text>
                </View>
                <ChevronDown size={18} color={disabled ? "#D1D5DB" : "#9CA3AF"} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select {label}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={`Search ${label}...`}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* List */}
                        <FlatList
                            data={filteredOptions}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.optionItem, item === value && styles.selectedOption]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={[styles.optionText, item === value && styles.selectedOptionText]}>
                                        {item}
                                    </Text>
                                    {item === value && <ArrowRight size={16} color="#2563EB" />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No results found</Text>
                            }
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const RegisterScreen = ({ navigation }) => {
    const setAuth = useAuthStore((state) => state?.setAuth);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [availableCities, setAvailableCities] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'student',
        college: '',
        city: '',
        state: ''
    });

    const redirectUri = "https://auth.expo.io/@hridesh607/mobile";

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '945252292622-l4j3vrisu6j0fl4t2vpfj379pjm6u5sr.apps.googleusercontent.com',
        webClientId: '945252292622-l4j3vrisu6j0fl4t2vpfj379pjm6u5sr.apps.googleusercontent.com',
        redirectUri: redirectUri,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) handleGoogleLogin(id_token);
        }
    }, [response]);

    // Update cities when state changes
    useEffect(() => {
        if (formData.state) {
            const cities = getCities(formData.state);
            setAvailableCities(cities);
            // Clear city if invalid for new state
            if (formData.city && !cities.includes(formData.city)) {
                handleChange('city', '');
            }
        } else {
            setAvailableCities([]);
            handleChange('city', '');
        }
    }, [formData.state]);

    const handleGoogleLogin = async (idToken) => {
        setGoogleLoading(true);
        try {
            const { data } = await api.post('/auth/google-login', {
                token: idToken,
                role: formData.role
            });
            if (setAuth && data?.data?.user && data?.data?.token) {
                await setAuth(data.data.user, data.data.token);
            }
        } catch (error) {
            console.error('Google Auth Error:', error);
            Alert.alert("Google Signup Failed", error.response?.data?.message || 'Something went wrong');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegister = async () => {
        const { name, email, password, phone, role, city, state, college } = formData;

        if (!name || !email || !password || !phone || !city || !state) {
            Alert.alert("Error", "Please fill in all mandatory fields (Name, Email, Password, Phone, City, State)");
            return;
        }
        if (role === 'student' && !college) {
            Alert.alert("Error", "College name is required for students");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', formData);
            if (setAuth && data?.data?.user && data?.data?.token) {
                await setAuth(data.data.user, data.data.token);
            }
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert("Registration Failed", error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <LinearGradient
                        colors={['#2563EB', '#7C3AED']}
                        style={styles.gradientHeader}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft color="#FFF" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.brandTitle}>Create Account</Text>
                        <Text style={styles.brandSubtitle}>Find your perfect home with HomeSarthi</Text>
                    </LinearGradient>
                </View>

                <View style={styles.formContainer}>
                    {/* Role Selection */}
                    <View style={styles.roleGrid}>
                        <TouchableOpacity
                            style={[
                                styles.roleCard,
                                formData.role === 'student' && styles.roleCardActiveStudent
                            ]}
                            onPress={() => handleChange('role', 'student')}
                        >
                            <View style={[
                                styles.roleIconBox,
                                { backgroundColor: formData.role === 'student' ? '#DBEAFE' : '#F3F4F6' }
                            ]}>
                                <GraduationCap
                                    size={24}
                                    color={formData.role === 'student' ? '#2563EB' : '#9CA3AF'}
                                />
                            </View>
                            <Text style={[
                                styles.roleLabel,
                                formData.role === 'student' && styles.roleLabelActiveStudent
                            ]}>Student</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.roleCard,
                                formData.role === 'owner' && styles.roleCardActiveOwner
                            ]}
                            onPress={() => handleChange('role', 'owner')}
                        >
                            <View style={[
                                styles.roleIconBox,
                                { backgroundColor: formData.role === 'owner' ? '#F3E8FF' : '#F3F4F6' }
                            ]}>
                                <Home
                                    size={24}
                                    color={formData.role === 'owner' ? '#7C3AED' : '#9CA3AF'}
                                />
                            </View>
                            <Text style={[
                                styles.roleLabel,
                                formData.role === 'owner' && styles.roleLabelActiveOwner
                            ]}>House Owner</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={18} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                value={formData.name}
                                onChangeText={(t) => handleChange('name', t)}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="john@example.com"
                                value={formData.email}
                                onChangeText={(t) => handleChange('email', t)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                            <Phone size={18} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChangeText={(t) => handleChange('phone', t)}
                                keyboardType="phone-pad"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* State & City Searchable Pickers */}
                    <SearchablePicker
                        label="State"
                        value={formData.state}
                        onSelect={(val) => handleChange('state', val)}
                        options={getStates()}
                        placeholder="Select State"
                        icon={MapPin}
                    />

                    <SearchablePicker
                        label="City"
                        value={formData.city}
                        onSelect={(val) => handleChange('city', val)}
                        options={availableCities}
                        placeholder={formData.state ? "Select City" : "Select State First"}
                        disabled={!formData.state}
                        icon={MapPin}
                    />

                    {formData.role === 'student' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>College Name</Text>
                            <View style={styles.inputWrapper}>
                                <School size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your college"
                                    value={formData.college}
                                    onChangeText={(t) => handleChange('college', t)}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={formData.password}
                                onChangeText={(t) => handleChange('password', t)}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        <Text style={styles.helperText}>Must be at least 6 characters</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleRegister}
                        disabled={loading || googleLoading}
                    >
                        <LinearGradient
                            colors={['#2563EB', '#7C3AED']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonText}>Create Account</Text>
                                    <ArrowRight size={20} color="#FFF" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={() => promptAsync()}
                        disabled={loading || googleLoading || !request}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#111827" />
                        ) : (
                            <View style={styles.googleButtonContent}>
                                <Text style={styles.googleIconText}>G</Text>
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </View>
                        )}
                    </TouchableOpacity> */}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { flexGrow: 1 },
    headerSection: { height: 220 },
    gradientHeader: { flex: 1, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingTop: 40 },
    backBtn: { position: 'absolute', top: 60, left: 20, padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12 },
    brandTitle: { fontSize: 30, fontWeight: '800', color: '#FFF' },
    brandSubtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginTop: 4 },
    formContainer: { marginTop: -30, backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, marginBottom: 20 },

    roleGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    roleCard: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FFF' },
    roleCardActiveStudent: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
    roleCardActiveOwner: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
    roleIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    roleLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    roleLabelActiveStudent: { color: '#2563EB' },
    roleLabelActiveOwner: { color: '#7C3AED' },

    inputGroup: { marginBottom: 16 },
    label: { color: '#374151', fontWeight: '700', marginBottom: 6, fontSize: 13 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 48, color: '#111827', fontSize: 15 },
    helperText: { fontSize: 11, color: '#9CA3AF', marginTop: 4, marginLeft: 2 },

    // Picker Styles
    pickerTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, justifyContent: 'space-between' },
    pickerText: { fontSize: 15, color: '#111827', flex: 1 },
    placeholderText: { color: '#9CA3AF' },
    disabledPicker: { backgroundColor: '#F3F4F6', opacity: 0.7 },
    disabledText: { color: '#D1D5DB' },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    closeBtn: { padding: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, marginBottom: 20, height: 48 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#111827', height: '100%' },
    optionItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionText: { fontSize: 16, color: '#374151' },
    selectedOption: { backgroundColor: '#EFF6FF', marginHorizontal: -20, paddingHorizontal: 20 },
    selectedOptionText: { color: '#2563EB', fontWeight: '700' },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 30 },

    mainButton: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 10, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    buttonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: { marginHorizontal: 12, color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

    googleButton: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    googleIconText: { fontSize: 18, fontWeight: 'bold', color: '#4285F4' },
    googleButtonText: { fontSize: 14, fontWeight: '700', color: '#374151' },

    footer: { paddingBottom: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: '#6B7280', fontSize: 14 },
    linkText: { color: '#2563EB', fontWeight: '800', fontSize: 14 },
});

export default RegisterScreen;
