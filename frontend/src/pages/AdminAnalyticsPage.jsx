import { useState, useEffect } from 'react';
import {
    MapPin, TrendingUp, Users, Home, Activity,
    Globe, ArrowRight, BarChart2, DollarSign, Download,
    Wallet, PieChart, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts';
import api from '../utils/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, subtext, color = "blue", icon: Icon }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden"
    >
        <div className={`absolute top-0 right-0 p-8 opacity-5 text-${color}-600`}>
            <Icon size={100} />
        </div>
        <div className="relative">
            <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-4 text-${color}-600`}>
                <Icon size={20} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
            {subtext && <p className="text-xs font-bold text-gray-500 mt-2">{subtext}</p>}
        </div>
    </motion.div>
);

const FilterBadge = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
    >
        {children}
    </button>
);

const AdminAnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('geo'); // geo, behavior, financial, conversion, trends
    const [geoData, setGeoData] = useState({ topUserCities: [], topListingCities: [] });
    const [behaviorData, setBehaviorData] = useState(null);
    const [financialData, setFinancialData] = useState(null);
    const [conversionData, setConversionData] = useState(null);

    // Trends Data State
    const [trendData, setTrendData] = useState(null);
    const [trendGranularity, setTrendGranularity] = useState('daily');

    // Advanced Filter State for Geography Drill-down
    const [geoFilter, setGeoFilter] = useState({ state: '', city: '' });
    const [drillDownData, setDrillDownData] = useState(null);

    // Complete list of Indian States & UTs
    const ALL_INDIAN_STATES = [
        'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
        'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Goa',
        'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
        'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
        'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    const [availableStates, setAvailableStates] = useState(ALL_INDIAN_STATES);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Fetch "All States" breakdown by default on mount or when filter changes
        fetchDrillDownData();
    }, [geoFilter]);

    useEffect(() => {
        if (activeTab === 'trends') {
            fetchTrendData();
        }
    }, [activeTab, trendGranularity]);

    const fetchTrendData = async () => {
        try {
            const res = await api.get(`/admin/analytics/time-series?collection=visits&granularity=${trendGranularity}`);
            if (res.data.success) {
                setTrendData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch trends:', error);
            toast.error('Failed to load trend data');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [geoRes, behaviorRes, financialRes, conversionRes] = await Promise.all([
                api.get('/admin/analytics/geographic-insights'),
                api.get('/admin/analytics/behavior'),
                api.get('/admin/analytics/financial'),
                api.get('/admin/analytics/conversion')
            ]);

            if (geoRes.data.success) setGeoData(geoRes.data.data);
            if (behaviorRes.data.success) setBehaviorData(behaviorRes.data.data);
            if (financialRes.data.success) setFinancialData(financialRes.data.data);
            if (conversionRes.data.success) setConversionData(conversionRes.data.data);

        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const fetchDrillDownData = async () => {
        try {
            const query = new URLSearchParams();
            if (geoFilter.state) query.append('state', geoFilter.state);

            // USE NEW POWERFUL ENDPOINT
            const response = await api.get(`/admin/analytics/geo-detailed?${query.toString()}`);
            if (response.data.success) {
                setDrillDownData(response.data.data);

                // If fetching all states (no filter), update the available states list to include any dynamic ones found + all static ones
                if (!geoFilter.state) {
                    const fetchedStates = response.data.data.map(item => item.name);
                    const mergedStates = Array.from(new Set([...ALL_INDIAN_STATES, ...fetchedStates])).sort();
                    setAvailableStates(mergedStates);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleExport = () => {
        if (activeTab === 'trends') {
            handleDownloadTrends();
            return;
        }

        try {
            let csvContent = "data:text/csv;charset=utf-8,";
            let filename = `analytics_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

            if (activeTab === 'geo') {
                csvContent += "Location,Total Users,Students,Owners,Active Listings,Avg Rent\n";
                // Export the merged data
                const dataToExport = drillDownData || [];
                dataToExport.forEach(item => {
                    csvContent += `${item.name},${item.totalUsers},${item.students},${item.owners},${item.activeListings},${item.avgRent}\n`;
                });
            } else if (activeTab === 'financial') {
                csvContent += "Metric,Value\n";
                csvContent += `Total Inventory Value,${financialData?.totalInventoryValue || 0}\n`;
                csvContent += `Average Rent,${financialData?.avgRent?.toFixed(2) || 0}\n`;
            } else {
                csvContent += "Metric,Value\n";
                csvContent += `Total Users,${behaviorData?.totalUsers || 0}\n`;
            }

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Report exported successfully');
        } catch (err) {
            toast.error('Export failed');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader size="large" />
        </div>
    );

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const handleDownloadVisits = async () => {
        try {
            const response = await api.get('/admin/visits/export', {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Visits_Report_Comprehensive.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Visit report downloaded successfully');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download visit report');
        }
    };

    const handleDownloadTrends = async () => {
        try {
            const response = await api.get(`/admin/analytics/time-series?collection=visits&granularity=${trendGranularity}&export=excel`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Trends_Report_${trendGranularity}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Trends report downloaded successfully');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download trends report');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Activity className="text-blue-600" /> Platform Intelligence
                    </h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        Data-Driven Insights & Regional Trends
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {['geo', 'behavior', 'financial', 'conversion', 'trends'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600 border-transparent'
                                    }`}
                            >
                                {(() => {
                                    switch (tab) {
                                        case 'geo': return 'Geography';
                                        case 'behavior': return 'Behavior';
                                        case 'financial': return 'Financials';
                                        case 'conversion': return 'Funnel';
                                        case 'trends': return 'Trends';
                                        default: return tab;
                                    }
                                })()}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExport}
                        className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors"
                        title="Export Current Tab Data"
                    >
                        <Download size={18} />
                    </button>
                    <button
                        onClick={handleDownloadVisits}
                        className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                        title="Download Full Visit Reports (Excel)"
                    >
                        <Download size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Visits Report</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Geographic Insights Tab */}
                {activeTab === 'geo' && (
                    <motion.div
                        key="geo"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        {/* ... (rest of geo content) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Interactive Map/Filter Section */}
                            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <Globe size={18} className="text-blue-600" /> Regional Breakdown Explorer
                                    </h3>
                                    <div className="flex gap-2">
                                        <select
                                            className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={geoFilter.state}
                                            onChange={(e) => setGeoFilter({ ...geoFilter, state: e.target.value })}
                                        >
                                            <option value="">All States Breakdown</option>
                                            {/* Use dynamic states from data if available, else static fallback */}
                                            {(drillDownData && !geoFilter.state ? drillDownData : availableStates).map(st => {
                                                const val = typeof st === 'string' ? st : st.name;
                                                return <option key={val} value={val}>{val}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={drillDownData || []} // Use new detailed data
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                cursor={{ fill: '#F3F4F6' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                            <Bar dataKey="students" name="Students" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="owners" name="Owners" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="activeListings" name="Active Rooms" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="rentedListings" name="Rented Rooms" stackId="a" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Stats Side Panel */}
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                                <h3 className="text-xl font-black mb-6">Insight Summary</h3>
                                <div className="space-y-6">
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Dominant Region</p>
                                        <p className="text-2xl font-black mt-1 capitalize">{geoData.topUserCities[0]?._id || 'N/A'}</p>
                                        <p className="text-xs text-indigo-300 font-bold mt-1">
                                            {geoData.topUserCities[0]?.count} total users
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Listing Hotspot</p>
                                        <p className="text-2xl font-black mt-1 capitalize">{geoData.topListingCities[0]?._id || 'N/A'}</p>
                                        <p className="text-xs text-emerald-300 font-bold mt-1">
                                            {geoData.topListingCities[0]?.count} properties listed
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            The data shows a strong correlation between student concentration in {geoData.topUserCities[0]?._id} and owner listings. Consider targeting ad spend in
                                            {geoData.topListingCities[1] ? ` ${geoData.topListingCities[1]._id}` : ' emerging markets'} to balance supply.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed City Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(drillDownData || []).map((region, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-black text-gray-900 capitalize">{region.name}</span>
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black">{region.totalUsers} Users</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-bold">Students</span>
                                                <span className="font-black text-gray-900">{region.students || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full" style={{ width: `${(region.students / (region.totalUsers || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-bold">Owners</span>
                                                <span className="font-black text-gray-900">{region.owners || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-green-500 h-full" style={{ width: `${(region.owners / (region.totalUsers || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-dashed border-gray-100 grid grid-cols-2 gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Active</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                    <span className="font-black text-gray-900">{region.activeListings || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Rented</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                                                    <span className="font-black text-gray-900">{region.rentedListings || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Behavior Insights Tab */}
                {activeTab === 'behavior' && (
                    <motion.div
                        key="behavior"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Total User Base"
                                value={behaviorData?.totalUsers}
                                subtext="Registered accounts across all roles"
                                icon={Users}
                                color="indigo"
                            />
                            <StatCard
                                title="Verification Rate"
                                value={`${behaviorData?.verifiedRate}%`}
                                subtext="Users with verified identities"
                                icon={PieChart}
                                color="green"
                            />
                            <StatCard
                                title="Weekly Active"
                                value={`${behaviorData?.activeRate}%`}
                                subtext="Users active in last 7 days"
                                icon={TrendingUp}
                                color="orange"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Financial Insights Tab */}
                {activeTab === 'financial' && (
                    <motion.div
                        key="financial"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Inventory Value"
                                value={`₹${(financialData?.totalInventoryValue || 0).toLocaleString()}`}
                                subtext="Total monthly rent potential"
                                icon={Wallet}
                                color="emerald"
                            />
                            <StatCard
                                title="Average Rent"
                                value={`₹${Math.round(financialData?.avgRent || 0).toLocaleString()}`}
                                subtext="Across all active listings"
                                icon={DollarSign}
                                color="blue"
                            />
                            <StatCard
                                title="Highest Rent"
                                value={`₹${(financialData?.highestRent || 0).toLocaleString()}`}
                                subtext="Premium listing benchmark"
                                icon={TrendingUp}
                                color="purple"
                            />
                            <StatCard
                                title="Deposit Pool"
                                value={`₹${(financialData?.totalDepositHeld || 0).toLocaleString()}`}
                                subtext="Total security deposits"
                                icon={PieChart}
                                color="rose"
                            />
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[400px]">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Financial Distribution Overview</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={[
                                        { name: 'Inventory Value', value: financialData?.totalInventoryValue || 0 },
                                        { name: 'Deposits Held', value: financialData?.totalDepositHeld || 0 }
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                                        {
                                            [
                                                { name: 'Inventory Value', value: financialData?.totalInventoryValue || 0 },
                                                { name: 'Deposits Held', value: financialData?.totalDepositHeld || 0 }
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F43F5E'} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {/* Conversion Funnel Tab */}
                {activeTab === 'conversion' && (
                    <motion.div
                        key="conversion"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                    >
                        {/* Funnel Visualization */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <Activity size={18} className="text-blue-600" /> Conversion Funnel
                                </h3>

                                <div className="space-y-4">
                                    {[
                                        { label: 'Total Requests', value: conversionData?.totalRequests || 0, color: 'bg-blue-500' },
                                        { label: 'Approved', value: conversionData?.approved || 0, color: 'bg-indigo-500' },
                                        { label: 'Visited (Show Up)', value: conversionData?.visited || 0, color: 'bg-purple-500' },
                                        { label: 'Rented (Converted)', value: conversionData?.rented || 0, color: 'bg-green-500' },
                                    ].map((step, idx) => (
                                        <div key={idx} className="relative group">
                                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1 px-1">
                                                <span>{step.label}</span>
                                                <span>{step.value}</span>
                                            </div>
                                            <div className="h-12 w-full bg-gray-50 rounded-xl overflow-hidden relative flex items-center">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(step.value / (conversionData?.totalRequests || 1)) * 100}%` }}
                                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                                    className={`h-full ${step.color} shadow-sm rounded-r-xl`}
                                                    style={{ minWidth: '4px' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <StatCard
                                        title="Approval Rate"
                                        value={`${conversionData?.approvalRate || 0}%`}
                                        subtext="Requests accepted by owners"
                                        icon={CheckCircle}
                                        color="indigo"
                                    />
                                    <StatCard
                                        title="Visit Rate"
                                        value={`${conversionData?.visitRate || 0}%`}
                                        subtext="Students who actually visited"
                                        icon={MapPin}
                                        color="purple"
                                    />
                                    <StatCard
                                        title="Conversion Rate"
                                        value={`${conversionData?.rentRate || 0}%`}
                                        subtext="Visits converted to rentals"
                                        icon={TrendingUp}
                                        color="green"
                                    />
                                    <StatCard
                                        title="Rejected"
                                        value={conversionData?.rejected || 0}
                                        subtext="Total rejected requests"
                                        icon={XCircle}
                                        color="red"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* Trends Analysis Tab */}
                {activeTab === 'trends' && (
                    <motion.div
                        key="trends"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-600" /> Visit & Rental Trends
                            </h3>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {['daily', 'weekly', 'monthly'].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setTrendGranularity(g)}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${trendGranularity === g
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm h-[400px]">
                            {trendData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorVisited" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorRented" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="_id.date"
                                            tickFormatter={(str) => {
                                                const d = new Date(str);
                                                return isNaN(d.getTime()) ? str : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                            }}
                                            tick={{ fontSize: 10, fontWeight: 'bold' }}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            labelFormatter={(str) => new Date(str).toLocaleDateString()}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            name="Requests"
                                            stroke="#3B82F6"
                                            fillOpacity={0.3}
                                            fill="url(#colorRequests)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="visited"
                                            name="Visited"
                                            stroke="#8B5CF6"
                                            fillOpacity={0.5}
                                            fill="url(#colorVisited)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="rented"
                                            name="Rented"
                                            stroke="#10B981"
                                            fillOpacity={0.8}
                                            fill="url(#colorRented)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 font-bold">
                                    Loading trend data...
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminAnalyticsPage;
