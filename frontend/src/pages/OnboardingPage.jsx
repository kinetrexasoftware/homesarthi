import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, FileText, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { compressImage } from '../utils/imageCompression';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be less than 2MB');
            return;
        }

        try {
            const compressedBlob = await compressImage(file);
            setAvatar(compressedBlob);
            setPreview(URL.createObjectURL(compressedBlob));
        } catch (error) {
            console.error('Compression error:', error);
            toast.error('Failed to process image');
        }
    };

    const handleNext = async () => {
        if (step === 1 && !avatar) {
            setStep(2);
            return;
        }
        if (step === 2) {
            await handleSubmit();
        } else {
            setStep(step + 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            if (bio) formData.append('bio', bio);
            if (avatar) formData.append('avatar', avatar, 'profile.jpg');

            const { data } = await api.put('/users/profile', formData);
            if (data.success) {
                updateUser(data.data.user);
                toast.success('Profile updated!');
                finishOnboarding();
            }
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const finishOnboarding = async () => {
        try {
            await api.post('/users/finish-onboarding');
            updateUser({ isFirstLogin: false });

            const role = user?.role;
            if (role === 'admin') navigate('/admin');
            else navigate('/');
        } catch (error) {
            console.error('Failed to finish onboarding:', error);
            // Even if it fails, try to navigate if we think they are done
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-500/5 p-8 border border-gray-100"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step === i ? 'bg-blue-600' : 'bg-gray-100'
                                    }`}
                            />
                        ))}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === 1 ? 'Add a profile photo' : 'Write a short bio'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        {step === 1
                            ? 'Profiles with photos get better responses.'
                            : 'Tell others a bit about yourself.'}
                    </p>
                </div>

                <div className="space-y-6">
                    {step === 1 ? (
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="text-gray-400 group-hover:text-blue-500" size={32} />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                                >
                                    <Camera size={16} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="I am a student at..."
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                maxLength={200}
                            />
                            <p className="text-right text-xs text-gray-400">{bio.length}/200</p>
                        </div>
                    )}

                    <div className="pt-4 space-y-3">
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                'Saving...'
                            ) : (
                                <>
                                    {step === 2 ? 'Complete Setup' : 'Continue'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                        <button
                            onClick={finishOnboarding}
                            className="w-full py-4 bg-white text-gray-500 font-semibold rounded-2xl hover:bg-gray-50 transition-all"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingPage;
