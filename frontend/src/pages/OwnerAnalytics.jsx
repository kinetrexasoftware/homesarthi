import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Eye, MessageCircle, Calendar, TrendingUp, TrendingDown,
    DollarSign, MapPin, Users, Zap, AlertCircle, CheckCircle,
    ChevronDown, ArrowUpRight, ArrowDownRight, Target, Clock,
    Sparkles, ThumbsUp, ThumbsDown, Mail, Phone, Image as ImageIcon, Timer
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, FunnelChart, Funnel,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';

const OwnerAnalytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7days');
    const [selectedRoom, setSelectedRoom] = useState('all');
    const [analyticsData, setAnalyticsData] = useState(null);

    useEffect(() => {
        fetchAnalyticsData();
    }, [dateRange, selectedRoom]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/analytics/owner/comprehensive', {
                params: {
                    period: dateRange,
                    roomId: selectedRoom
                }
            });

            if (data.success) {
                setAnalyticsData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (insight) => {
        if (!insight) return;

        if (insight.action === 'Adjust Price' && insight.roomId) {
            navigate(`/owner/rooms/${insight.roomId}/edit`);
        } else if (insight.action === 'Upload Photos' && insight.roomId) {
            navigate(`/owner/rooms/${insight.roomId}/edit`);
        } else if (insight.action === 'Highlight Deal') {
            toast.success('Deal highlighted! (This is a demo feature)');
            if (insight.roomId) navigate(`/owner/rooms/${insight.roomId}/edit`);
        } else if (insight.action === 'Extend Availability' && insight.roomId) {
            navigate(`/owner/rooms/${insight.roomId}/edit`);
        } else if (insight.action === 'Enable Notifications') {
            toast.success('Notifications enabled!');
        } else {
            console.log('Unknown action:', insight.action); // Debugging
        }
    };

    if (loading || !analyticsData) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const iconMap = {
        'AlertCircle': AlertCircle,
        'Clock': Clock,
        'TrendingUp': TrendingUp,
        'ImageIcon': ImageIcon,
        'Target': Target
    };

    // ... imports remain the same ...

    // Minimal Status Logic
    const getRoomStatus = (room) => {
        if (room.bookings > 0) return { label: 'Doing well', color: 'bg-green-100 text-green-700', icon: CheckCircle };
        if (room.views > 50 && room.inquiries === 0) return { label: 'Needs work', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle };
        if (room.price > room.marketAvg * 1.15) return { label: 'Overpriced', color: 'bg-red-100 text-red-700', icon: TrendingDown };
        if (room.price < room.marketAvg * 0.8) return { label: 'Good Deal', color: 'bg-blue-100 text-blue-700', icon: TrendingUp };
        return { label: 'Active', color: 'bg-gray-100 text-gray-700', icon: CheckCircle };
    };

    const summaryCards = [
        { label: 'Total Views', value: analyticsData.overview.totalViews, sub: 'People saw your rooms' },
        { label: 'Inquiries', value: analyticsData.overview.inquiries, sub: 'People contacted you' },
        { label: 'Bookings', value: analyticsData.overview.bookings, sub: 'Confirmed tenants' },
        { label: 'Occupancy', value: `${analyticsData.occupancy?.rate || 0}%`, sub: `${analyticsData.occupancy?.occupied}/${analyticsData.occupancy?.total} filled` },
        { label: 'This Month\'s Income', value: `₹${(analyticsData.overview.revenue).toLocaleString()}`, sub: 'Estimated earnings' }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="max-w-5xl mx-auto px-4 py-6">

                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
                    <p className="text-sm text-gray-500">Overview of your rental business</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
                    {summaryCards.map((card, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">{card.label}</p>
                            <h3 className="text-xl font-black text-gray-900 mb-1">{card.value}</h3>
                            <p className="text-[10px] text-gray-500">{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-12 gap-6 mb-8">

                    {/* Interest Trend (Line Chart) */}
                    <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Interest Trend</h3>
                        <p className="text-xs text-gray-500 mb-6">Views and inquiries over time</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData.viewTrend}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Area type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={3} fillUrl="url(#colorViews)" />
                                    <Area type="monotone" dataKey="inquiries" stroke="#8B5CF6" strokeWidth={3} fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Tips & Alerts */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Best Time to Reply */}
                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={18} className="text-indigo-600" />
                                <h4 className="font-bold text-indigo-900">Best Time to Reply</h4>
                            </div>
                            <p className="text-sm text-indigo-700">
                                Most students contact you between <span className="font-black">7 PM - 10 PM</span>. Be online then!
                            </p>
                        </div>

                        {/* Actionable Alerts (AI) */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-yellow-500" />
                                <h4 className="font-bold text-gray-900">Smart Tips</h4>
                            </div>
                            <div className="space-y-3">
                                {analyticsData.actionableInsights.slice(0, 3).map((insight, i) => (
                                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex gap-3">
                                            <div className="mt-1"><AlertCircle size={14} className="text-blue-500" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800 mb-1">{insight.title}</p>
                                                <button
                                                    onClick={() => handleAction(insight)}
                                                    className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"
                                                >
                                                    {insight.action} →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {analyticsData.actionableInsights.length === 0 && (
                                    <p className="text-xs text-gray-400">No new tips instantly. Great job!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Room Performance Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">My Listings</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Room</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Performance</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price Check</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {analyticsData.roomPerformance.map(room => {
                                    const status = getRoomStatus(room);
                                    return (
                                        <tr key={room.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900 text-sm">{room.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Views</p>
                                                        <p className="font-bold text-gray-900">{room.views}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Inquiries</p>
                                                        <p className="font-bold text-gray-900">{room.inquiries}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">₹{room.price}</p>
                                                <p className="text-xs text-gray-400">Avg: ₹{room.marketAvg}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                                    <status.icon size={10} />
                                                    {status.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/owner/rooms/${room.id}/edit`)}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                                                >
                                                    Edit Price
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OwnerAnalytics;
