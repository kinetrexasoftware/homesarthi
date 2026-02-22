import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const DeleteAccountPage = () => {
    const [loading, setLoading] = useState(false);
    const { logout, user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    const handleDeleteRequest = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to request account deletion');
            navigate('/login');
            return;
        }

        const confirm = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone and your data will be permanently erased within 72 hours."
        );

        if (!confirm) return;

        setLoading(true);
        try {
            const { data } = await api.delete('/users/delete-account');
            if (data?.success) {
                toast.success(data.message, { duration: 6000 });
                setTimeout(() => {
                    logout();
                    navigate('/');
                }, 3000);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit deletion request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
            >
                <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Account Deletion Request</h1>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Info Section */}
                        <div>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                    <h3 className="font-bold text-red-900 text-lg">Important Information</h3>
                                </div>
                                <ul className="space-y-3 text-red-800">
                                    <li className="flex gap-2">
                                        <span className="font-bold">•</span>
                                        <span>Your account will be deactivated immediately.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">•</span>
                                        <span>All your listings, messages, and personal data will be permanently deleted.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">•</span>
                                        <span>This process will be completed within 72 hours.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">•</span>
                                        <span className="font-bold">This action cannot be undone.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Privacy Compliance</h4>
                                        <p className="text-gray-600">This request is processed in accordance with Google Play Store Data Safety policies.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Section */}
                        <div className="flex flex-col justify-center bg-gray-50 rounded-3xl p-8 border border-gray-100">
                            {isAuthenticated ? (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 border border-gray-200">
                                        {user?.avatar?.url ? (
                                            <img src={user.avatar.url} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
                                        ) : (
                                            <Trash2 className="w-10 h-10 text-gray-400" />
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Hello, {user?.name}</h2>
                                    <p className="text-gray-600 mb-8">Click below to permanently delete your HomeSarthi account.</p>

                                    <button
                                        onClick={handleDeleteRequest}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg ${loading
                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/20'
                                            }`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        {loading ? 'Processing...' : 'Request Permanently Deletion'}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                                    <p className="text-gray-600 mb-8">To request account deletion, you must first log in to your account.</p>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20"
                                    >
                                        Login to Continue
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 p-6 text-center">
                    <p className="text-sm text-gray-500">
                        Need help? Contact us at <a href="mailto:homesarthi247@gmail.com" className="text-blue-600 font-medium">homesarthi247@gmail.com</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteAccountPage;
