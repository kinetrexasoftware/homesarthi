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
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronLeft, User, Phone, Save, X } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const EditProfileScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const setAuth = useAuthStore((state) => state?.setAuth);
    const token = useAuthStore((state) => state?.token);

    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        bio: user?.bio || ''
    });

    const handleImagePick = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery access is required to change profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setAvatarPreview(asset.uri);
            setAvatarFile({
                uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                name: 'avatar.jpg',
                type: 'image/jpeg'
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('phone', formData.phone);
            data.append('bio', formData.bio);

            if (avatarFile) {
                data.append('avatar', avatarFile);
            }

            const response = await api.put('/users/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                // Update local store - keeping the token same
                const newUser = response.data.data.user;
                await setAuth(newUser, token);
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Update Profile Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
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
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
                        {avatarPreview ? (
                            <Image source={{ uri: avatarPreview }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{user?.name?.charAt(0)}</Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Camera size={16} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Tap to change photo</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Full Name"
                        value={formData.name}
                        onChangeText={(v) => setFormData({ ...formData, name: v })}
                        placeholder="Enter your name"
                        leftIcon={<User size={20} color="#9CA3AF" />}
                    />
                    <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(v) => setFormData({ ...formData, phone: v })}
                        placeholder="Enter phone number" keyboardType="phone-pad"
                        leftIcon={<Phone size={20} color="#9CA3AF" />}
                    />
                    <Input
                        label="Bio"
                        value={formData.bio}
                        onChangeText={(v) => setFormData({ ...formData, bio: v })}
                        placeholder="Tell us a bit about yourself"
                        multiline
                        numberOfLines={4}
                        style={{ height: 100, textAlignVertical: 'top' }}
                    />

                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Email Address</Text>
                        <Text style={styles.infoValue}>{user?.email}</Text>
                        <Text style={styles.infoHint}>Email cannot be changed.</Text>
                    </View>
                </View>

                <Button
                    title="Save Changes"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.saveBtn}
                />

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.cancelBtn}
                    disabled={loading}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
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
        backgroundColor: '#FFFFFF',
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
    avatarSection: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderWidth: 4,
        borderColor: '#EFF6FF',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#111827',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarHint: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    form: {
        marginTop: 8,
    },
    infoBox: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    infoHint: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
        fontStyle: 'italic',
    },
    saveBtn: {
        marginTop: 32,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    cancelBtn: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 12,
    },
    cancelText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    }
});

export default EditProfileScreen;
