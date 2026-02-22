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
    TextInput,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lock, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import api from '../services/api';

const ResetPasswordScreen = ({ route, navigation }) => {
    const { email } = route.params;
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        otp: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async () => {
        const { otp, password, confirmPassword } = formData;

        if (!otp || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/reset-password', {
                otp,
                password,
                confirmPassword
            });

            if (response.data.success) {
                Alert.alert('Success', 'Password reset successfully!', [
                    { text: 'Login Now', onPress: () => navigation.navigate('Login') }
                ]);
            }
        } catch (error) {
            console.error('Reset Password Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
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
                            <Lock color="#FFF" size={32} />
                        </View>
                        <Text style={styles.brandTitle}>Secure Account</Text>
                        <Text style={styles.brandSubtitle}>Set a strong new password</Text>
                    </LinearGradient>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>OTP Verification</Text>
                        <View style={styles.inputWrapper}>
                            <KeyRound size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter 6-digit OTP"
                                value={formData.otp}
                                onChangeText={(v) => setFormData({ ...formData, otp: v })}
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        <Text style={styles.infoText}>OTP sent to {email}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Min. 6 characters"
                                secureTextEntry={!showPassword}
                                value={formData.password}
                                onChangeText={(v) => setFormData({ ...formData, password: v })}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Re-type password"
                                secureTextEntry={!showPassword}
                                value={formData.confirmPassword}
                                onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
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
                                    <Text style={styles.buttonText}>Reset Password</Text>
                                    <ArrowRight size={20} color="#FFF" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerSection: {
        height: 280,
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
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
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
        marginTop: 8,
        color: '#6B7280',
        fontSize: 12,
    },
    mainButton: {
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
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
});

export default ResetPasswordScreen;
