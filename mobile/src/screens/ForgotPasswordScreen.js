import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Mail, ArrowRight, KeyRound } from 'lucide-react-native';
import api from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            Alert.alert('Success', data.message || 'OTP sent to your email', [
                { text: 'OK', onPress: () => navigation.navigate('ResetPassword', { email }) }
            ]);
        } catch (error) {
            console.error('Forgot password error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <LinearGradient
                        colors={['#2563EB', '#7C3AED']}
                        style={styles.gradientHeader}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backBtn}
                        >
                            <ChevronLeft color="#FFF" size={24} />
                        </TouchableOpacity>

                        <View style={styles.iconWrapper}>
                            <KeyRound color="#FFF" size={32} />
                        </View>
                        <Text style={styles.brandTitle}>Reset Password</Text>
                        <Text style={styles.brandSubtitle}>Recovery code will be sent to your email</Text>
                    </LinearGradient>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your registered email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        <Text style={styles.infoText}>
                            We'll send a 6-digit OTP code to verify your ownership of this account.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleSubmit}
                        disabled={loading}
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
                                    <Text style={styles.buttonText}>Send OTP</Text>
                                    <ArrowRight size={20} color="#FFF" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.footer}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.footerText}>Remember your password? </Text>
                    <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// Reusing styles from LoginScreen for consistency
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerSection: {
        height: 300,
    },
    gradientHeader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingTop: 40,
    },
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    iconWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    brandSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 15,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    formContainer: {
        marginTop: -40,
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        color: '#374151',
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 14,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 52,
        color: '#111827',
        fontSize: 16,
    },
    infoText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 13,
        lineHeight: 18,
    },
    mainButton: {
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    footer: {
        padding: 32,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: 15,
    },
    linkText: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default ForgotPasswordScreen;
