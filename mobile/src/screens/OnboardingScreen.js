import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ArrowRight, X } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const OnboardingScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const updateUser = useAuthStore((state) => state?.updateUser);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0]);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            if (bio) formData.append('bio', bio);
            if (avatar) {
                const uri = avatar.uri;
                const name = uri.split('/').pop();
                const type = 'image/jpeg';
                formData.append('avatar', { uri, name, type });
            }

            const { data } = await api.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success) {
                updateUser(data.data.user);
                finishOnboarding();
            }
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const finishOnboarding = async () => {
        try {
            await api.post('/users/finish-onboarding');
            updateUser({ isFirstLogin: false });
            // Navigation handled by App.js session check usually, 
            // but we can force it here
        } catch (error) {
            console.error('Finish onboarding error:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.stepsContainer}>
                    {[1, 2].map((i) => (
                        <View
                            key={i}
                            style={[styles.stepBar, step === i ? styles.stepBarActive : styles.stepBarInactive]}
                        />
                    ))}
                </View>

                <Text style={styles.title}>
                    {step === 1 ? 'Add a profile photo' : 'Write a short bio'}
                </Text>
                <Text style={styles.subtitle}>
                    {step === 1
                        ? 'Profiles with photos get better responses.'
                        : 'Tell others a bit about yourself.'}
                </Text>

                {step === 1 ? (
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        {avatar ? (
                            <Image source={{ uri: avatar.uri }} style={styles.preview} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Camera size={40} color="#9CA3AF" />
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Camera size={16} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.bioContainer}>
                        <TextInput
                            style={styles.bioInput}
                            placeholder="I am a student at..."
                            multiline
                            numberOfLines={4}
                            value={bio}
                            onChangeText={setBio}
                            maxLength={200}
                        />
                        <Text style={styles.charCount}>{bio.length}/200</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.nextBtn, loading && styles.disabledBtn]}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.nextBtnText}>{step === 2 ? 'Complete Setup' : 'Continue'}</Text>
                                <ArrowRight size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding} disabled={loading}>
                        <Text style={styles.skipBtnText}>Skip for now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    stepsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
        marginTop: 20,
    },
    stepBar: {
        height: 6,
        width: 40,
        borderRadius: 3,
    },
    stepBarActive: {
        backgroundColor: '#2563EB',
    },
    stepBarInactive: {
        backgroundColor: '#F3F4F6',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 40,
    },
    imagePicker: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    preview: {
        width: '100%',
        height: '100%',
        borderRadius: 70,
    },
    placeholder: {
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    bioContainer: {
        width: '100%',
    },
    bioInput: {
        width: '100%',
        height: 120,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
    footer: {
        width: '100%',
        marginTop: 'auto',
        gap: 12,
        marginBottom: 20,
    },
    nextBtn: {
        flexDirection: 'row',
        backgroundColor: '#2563EB',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipBtn: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipBtnText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});

export default OnboardingScreen;
