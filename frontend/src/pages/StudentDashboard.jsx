import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Calendar, MessageCircle, Search, User,
  Mail, Phone, BookOpen, Settings, CheckCircle,
  ArrowRight, ShieldCheck, Camera, Edit2, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';

const StudentDashboard = () => {
  const { user, calculateCompletion, updateUser } = useAuthStore();
  const completion = calculateCompletion(user);

  const [stats, setStats] = useState({
    savedRooms: 0,
    visits: 0,
    messages: 0
  });

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [savedRooms, visits, chats] = await Promise.all([
        api.get('/users/profile'),
        api.get('/visits/my-visits'),
        api.get('/chat/conversations')
      ]);

      setStats({
        savedRooms: savedRooms.data.data.user.savedRooms.length,
        visits: visits.data.data.visits.length,
        messages: chats.data.data?.conversations?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Logic from ProfilePage to keep it consistent
      const { data } = await api.put('/users/profile', formData);
      if (data.success) {
        updateUser(data.data.user);
        setEditing(false);
      }
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    high: 'text-green-600 bg-green-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-red-600 bg-red-50'
  };

  const getCompletionStatus = (val) => {
    if (val >= 80) return statusColors.high;
    if (val >= 50) return statusColors.medium;
    return statusColors.low;
  };

  const dashboardStats = [
    { label: 'Saved', value: stats.savedRooms, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', link: '/profile' },
    { label: 'Visits', value: stats.visits, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', link: '/visits' },
    { label: 'Chats', value: stats.messages, icon: MessageCircle, color: 'text-indigo-500', bg: 'bg-indigo-50', link: '/chat' }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Sticky Edit Mode Banner */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-[60] p-4 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-lg"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <Edit2 size={18} />
                  </div>
                  <span className="font-bold text-gray-900 hidden sm:inline">You're in Edit Mode</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Dashboard <span className="text-blue-600">.</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Welcome back, <span className="text-gray-900">{user?.name}</span> 👋
            </p>
          </div>
          <Link
            to="/rooms"
            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
          >
            <Search size={18} />
            Find a Room
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Profile & Trust (Cols 1-4) */}
          <aside className="lg:col-span-4 space-y-8">

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

              <div className="relative z-10 text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-indigo-600">
                    <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gray-100">
                      {user?.avatar?.url ? (
                        <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-blue-600">
                          {user?.name?.[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-7 h-7 bg-green-500 border-4 border-white rounded-full" />
                </div>

                <h3 className="text-2xl font-black text-gray-900 leading-tight">{user?.name}</h3>
                {user?.customId && (
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">ID: {user.customId}</p>
                )}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] uppercase font-black tracking-widest rounded-full border border-blue-100">
                    Student Account
                  </span>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-2 gap-4">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">Dec 2023</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span className="text-sm font-bold text-gray-900">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profile Strength Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-black text-gray-900 flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-600" />
                  Profile Strength
                </h4>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${getCompletionStatus(completion)}`}>
                  {completion > 80 ? 'Excellent' : 'Needs Work'}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-gray-100"
                      strokeDasharray="100, 100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-blue-600 transition-all duration-1000 ease-out"
                      strokeDasharray={`${completion}, 100`}
                      strokeLinecap="round"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-gray-900">{completion}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    Complete your profile to build trust with owners.
                  </p>
                  <Link to="/profile" className="text-xs font-black text-blue-600 uppercase tracking-widest mt-2 inline-block hover:underline">
                    Edit Now →
                  </Link>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* MAIN COLUMN: Content (Cols 5-12) */}
          <main className="lg:col-span-8 space-y-8">

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {dashboardStats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="relative z-10">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12`}>
                      <stat.icon size={24} />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
                      </div>
                      <Link
                        to={stat.link}
                        className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Personal Information & Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 bg-gray-50/30">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Personal Information</h3>
                  <p className="text-sm font-medium text-gray-500">Your public appearance and contact info.</p>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-black text-gray-600 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                >
                  {editing ? <><X size={16} /> Close</> : <><Edit2 size={16} /> Edit Info</>}
                </button>
              </div>

              <div className="p-8">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                          type="text"
                          name="name"
                          readOnly={!editing}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all outline-none text-sm font-bold ${editing ? 'bg-white border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full pl-12 pr-12 py-4 bg-gray-50 border-transparent rounded-2xl text-sm font-bold text-gray-300 cursor-not-allowed"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-sm">
                          <ShieldCheck size={16} className="text-green-500" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                          type="text"
                          name="phone"
                          readOnly={!editing}
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all outline-none text-sm font-bold ${editing ? 'bg-white border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Current College</label>
                      <div className="relative group">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                          type="text"
                          disabled
                          value={user?.college || 'Not Shared'}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl text-sm font-bold text-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Introduction / Bio</label>
                    <textarea
                      readOnly={!editing}
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Write something about yourself..."
                      className={`w-full p-6 rounded-[2rem] border transition-all outline-none text-sm font-bold resize-none ${editing ? 'bg-white border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-gray-50 border-transparent text-gray-400'}`}
                    />
                  </div>
                </form>
              </div>
            </motion.div>

            {/* Quick Actions Footer Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2">Looking for a Room?</h3>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed">Browse over 2,000+ verified student-friendly listings in your area.</p>
                  <Link to="/rooms" className="px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-colors shadow-xl">
                    Browse Listing
                  </Link>
                </div>
              </div>

              <div className="bg-blue-600 rounded-[2rem] p-10 text-white relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2">Help Center</h3>
                  <p className="text-blue-100 text-sm mb-8 leading-relaxed">Have questions? Our support team is here to help you 24/7.</p>
                  <button className="px-8 py-3.5 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-colors shadow-xl">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
