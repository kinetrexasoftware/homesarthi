import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, ShieldCheck, ArrowLeft, Mail, Info, Clock, Database } from 'lucide-react';
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
            "Are you sure you want to delete your account? This action cannot be undone and all your data including listings and messages will be permanently erased."
        );

        if (!confirm) return;

        setLoading(true);
        try {
            const { data } = await api.delete('/users/delete-account');
            if (data?.success) {
                toast.success(data.message || 'Account deletion request submitted', { duration: 6000 });
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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100"
                >
                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-10">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-3 hover:bg-gray-100 rounded-2xl transition-all group"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Data Deletion Request</h1>
                                <p className="text-gray-500 font-medium">HomeSarthi Account & Data Removal</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-5 gap-12">
                            {/* Left Side: Policy & Info */}
                            <div className="md:col-span-3 space-y-8">
                                <section className="bg-red-50/50 border border-red-100 rounded-[1.5rem] p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-red-100 rounded-xl">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <h3 className="font-bold text-red-900 text-lg">Permanent Action</h3>
                                    </div>
                                    <p className="text-red-800/80 text-sm mb-4 leading-relaxed">
                                        Once your account is deleted, it cannot be recovered. All associated data will be purged from our servers.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 text-sm text-red-800">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                            <span>Immediate loss of access to your rooms, bookings, and chats.</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-red-800">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                            <span>Your profile, photos, and identity verification will be deleted.</span>
                                        </div>
                                    </div>
                                </section>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">What data is deleted?</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                Profile information (name, email, phone), User avatars, Room listings, Saved properties, and Chat history are all permanently removed.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Retention Period</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                Requests are typically processed within 48-72 hours. Some transactional data may be kept for legal or regulatory purposes as per our privacy policy.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Google Play Compliant</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                This process adheres to Google's Data Safety requirements for account deletion.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Action Card */}
                            <div className="md:col-span-2">
                                <div className="sticky top-8 bg-gray-50 rounded-[2rem] p-8 border border-gray-100 flex flex-col items-center text-center">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="relative mb-6">
                                                <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden ring-4 ring-white shadow-xl">
                                                    {user?.avatar?.url ? (
                                                        <img src={user.avatar.url} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                                                            {user?.name?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
                                            <p className="text-sm text-gray-500 mb-8">{user?.email}</p>

                                            <button
                                                onClick={handleDeleteRequest}
                                                disabled={loading}
                                                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all ${loading
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-200 hover:shadow-red-300 active:scale-[0.98]'
                                                    }`}
                                            >
                                                {loading ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : <Trash2 className="w-5 h-5" />}
                                                Confirm Deletion
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-gray-200 rounded-[1.5rem] flex items-center justify-center mb-6">
                                                <Trash2 className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 mb-2">Auth Required</h2>
                                            <p className="text-sm text-gray-500 mb-8">
                                                To protect your security, you must be logged in to delete your account.
                                            </p>
                                            <button
                                                onClick={() => navigate('/login')}
                                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98]"
                                            >
                                                Login to Proceed
                                            </button>
                                        </>
                                    )}

                                    <div className="mt-8 pt-6 border-t border-gray-200 w-full space-y-4">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Alternatively</p>
                                        <a
                                            href="mailto:homesarthi247@gmail.com?subject=Account%20Deletion%20Request"
                                            className="flex items-center justify-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email Support
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 border-t border-gray-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-gray-400" />
                            <p className="text-sm text-gray-500">
                                This page is provided for Google Play Store compliance.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Privacy</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>Terms</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>Compliance</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DeleteAccountPage;

