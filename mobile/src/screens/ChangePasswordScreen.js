import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { ChevronLeft, Lock, ShieldCheck } from 'lucide-react-native';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const ChangePasswordScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const user = useAuthStore((state) => state.user);
    const hasPassword = user?.hasPassword;

    const handleSubmit = async () => {
        const { oldPassword, newPassword, confirmPassword } = formData;

        if ((hasPassword && !oldPassword) || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await api.put('/users/change-password', {
                oldPassword: hasPassword ? oldPassword : '',
                newPassword
            });

            if (response.data.success) {
                Alert.alert('Success', 'Password updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Change Password Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{hasPassword ? 'Change Password' : 'Set Password'}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <View style={styles.shieldBg}>
                        <ShieldCheck size={40} color="#2563EB" />
                    </View>
                    <Text style={styles.subtitle}>
                        {hasPassword
                            ? 'Update your password to keep your account secure.'
                            : 'Set a password to secure your account and enable email login.'}
                    </Text>
                </View>

                <View style={styles.form}>
                    {hasPassword && (
                        <>
                            <Input
                                label="Current Password"
                                secureTextEntry
                                value={formData.oldPassword}
                                onChangeText={(v) => setFormData({ ...formData, oldPassword: v })}
                                placeholder="••••••••"
                                leftIcon={<Lock size={20} color="#9CA3AF" />}
                            />
                            <View style={styles.divider} />
                        </>
                    )}
                    <Input
                        label="New Password"
                        secureTextEntry
                        value={formData.newPassword}
                        onChangeText={(v) => setFormData({ ...formData, newPassword: v })}
                        placeholder="••••••••"
                        leftIcon={<Lock size={20} color="#9CA3AF" />}
                    />
                    <Input
                        label="Confirm New Password"
                        secureTextEntry
                        value={formData.confirmPassword}
                        onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
                        placeholder="••••••••"
                        leftIcon={<Lock size={20} color="#9CA3AF" />}
                    />
                </View>

                <Button
                    title="Update Password"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitBtn}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: 40,
    },
    shieldBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    form: {
        marginBottom: 32,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    submitBtn: {
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    }
});

export default ChangePasswordScreen;
