import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../utils/api';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            toast.success(data.message);
            // Navigate to reset password page with email state
            navigate('/reset-password', { state: { email } });
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Left Side - Image & Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-600"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90 z-10" />
                <img
                    src="/auth-bg.png"
                    alt="Student Housing"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
                />

                <div className="relative z-20 flex flex-col justify-between p-16 h-full text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <KeyRound className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold tracking-wider">StayHome</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-5xl font-bold leading-tight"
                        >
                            Forgot your password?
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="text-lg text-blue-100"
                        >
                            Don't worry, we'll help you reset it. Enter your email address and we'll send you an OTP.
                        </motion.p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-blue-100">
                        <span>© 2024 StayHome. All rights reserved.</span>
                    </div>
                </div>
            </motion.div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                        <p className="mt-2 text-gray-600">Enter your email to receive an OTP</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                                {!loading && <ArrowRight size={18} />}
                            </button>

                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200"
                            >
                                <ArrowLeft size={18} />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
