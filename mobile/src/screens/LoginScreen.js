import React, { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
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
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';

// 1. Mandatory for WebBrowser to handle redirects
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
    const setAuth = useAuthStore((state) => state?.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // 2. FORCE EXPO PROXY URI (Hardcoded to match Google Cloud Console)
    const redirectUri = "https://auth.expo.io/@hridesh607/mobile";

    useEffect(() => {
        console.log("-----------------------------------------");
        console.log("👉 Google Console Redirect URI:", redirectUri);
        console.log("👉 Ensure this matches exactly in Google Cloud Console > Authorized Redirect URIs");
        console.log("-----------------------------------------");
    }, []);

    // 3. Configure Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        // Force Web Client ID for ALL platforms to ensure the Proxy Redirect URI is valid.
        // We comment out native IDs so the app doesn't switch to them automatically.
        clientId: '945252292622-l4j3vrisu6j0fl4t2vpfj379pjm6u5sr.apps.googleusercontent.com',
        webClientId: '945252292622-l4j3vrisu6j0fl4t2vpfj379pjm6u5sr.apps.googleusercontent.com',

        // androidClientId: '...', // DO NOT USE for Proxy Flow
        // iosClientId: '...',     // DO NOT USE for Proxy Flow

        redirectUri: redirectUri,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (!id_token) {
                Alert.alert("Error", "No Google ID Token found.");
                return;
            }
            handleGoogleLogin(id_token);
        } else if (response?.type === 'error') {
            Alert.alert("Google Auth Error", response.error?.message || "Authentication failed");
        }
    }, [response]);

    const handleGoogleLogin = async (idToken) => {
        setGoogleLoading(true);
        try {
            const { data } = await api.post('/auth/google-login', { token: idToken });
            if (setAuth && data?.data?.user && data?.data?.token) {
                await setAuth(data.data.user, data.data.token);
            }
        } catch (error) {
            console.error('Google Login Error:', error);
            Alert.alert("Google Login Failed", error.response?.data?.message || 'Something went wrong');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        if (!formData.email || !formData.password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', formData);
            if (setAuth && data?.data?.user && data?.data?.token) {
                await setAuth(data.data.user, data.data.token);
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert("Login Failed", error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <LinearGradient
                        colors={['#2563EB', '#7C3AED']}
                        style={styles.gradientHeader}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.iconWrapper}>
                            <LogIn color="#FFF" size={32} />
                        </View>
                        <Text style={styles.brandTitle}>HomeSarthi</Text>
                        <Text style={styles.brandSubtitle}>Welcome to your new home</Text>
                    </LinearGradient>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Password</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={formData.password}
                                onChangeText={(text) => handleChange('password', text)}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleSubmit}
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
                                    <Text style={styles.buttonText}>Sign In</Text>
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
                                <Text style={styles.googleButtonText}>Sign in with Google</Text>
                            </View>
                        )}
                    </TouchableOpacity> */}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Create free account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { flexGrow: 1 },
    headerSection: { height: 280 },
    gradientHeader: { flex: 1, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    iconWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 16, borderRadius: 20, marginBottom: 16 },
    brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', letterSpacing: 1 },
    brandSubtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginTop: 8 },
    formContainer: { marginTop: -40, backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    inputGroup: { marginBottom: 20 },
    label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 14 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    forgotText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 52, color: '#111827', fontSize: 16 },
    eyeIcon: { padding: 8 },
    mainButton: { height: 56, borderRadius: 12, overflow: 'hidden', marginTop: 8 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: { marginHorizontal: 12, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    googleButton: { height: 56, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    googleIconText: { fontSize: 20, fontWeight: 'bold', color: '#4285F4' },
    googleButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
    footer: { padding: 32, flexDirection: 'row', justifyContent: 'center' },
    footerText: { color: '#6B7280', fontSize: 15 },
    linkText: { color: '#2563EB', fontWeight: 'bold', fontSize: 15 },
});

export default LoginScreen;
