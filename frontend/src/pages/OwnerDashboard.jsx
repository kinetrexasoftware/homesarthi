import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Eye, MessageCircle, TrendingUp, Plus,
  Users, BarChart3, Settings, LogOut, ChevronRight,
  Clock, CheckCircle2, XCircle, MoreVertical, Search,
  Filter, ArrowUpRight, ArrowDownRight, LayoutDashboard,
  Calendar, MapPin, DollarSign, MessageSquare
} from 'lucide-react'; // Verify icons
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
  LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import ProfileCompletion from '../components/common/ProfileCompletion';
import toast from 'react-hot-toast';
import { formatRoomAddress, formatCurrency } from '../utils/helpers';
import SupportPanel from '../components/owner/SupportPanel';

const OwnerDashboard = () => {
  const { user, calculateCompletion, logout } = useAuthStore();
  const navigate = useNavigate();
  const completion = calculateCompletion(user);

  const [stats, setStats] = useState({
    rooms: 0,
    totalStats: { totalViews: 0, uniqueViewers: 0, inquiries: 0, bookings: 0 },
    trends: { totalViews: 0, uniqueViewers: 0, inquiries: 0, bookings: 0 }
  });
  const [analytics, setAnalytics] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [myVisits, setMyVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: analyticsData } = await api.get('/analytics/owner/dashboard', {
        params: { period }
      });
      setStats(analyticsData.data);
      setAnalytics(analyticsData.data.dailyAnalytics || []);

      const [roomsRes, visitsRes] = await Promise.all([
        api.get('/rooms/my-rooms'),
        api.get('/visits/my-visits')
      ]);

      setMyRooms(roomsRes.data.data.rooms || []);
      setMyVisits(visitsRes.data.data.visits || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Unable to sync dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (visitId, status) => {
    try {
      const { data } = await api.put(`/visits/${visitId}/respond`, {
        status,
        response: status === 'approved' ? 'Request approved. Look forward to meeting you!' : 'Sorry, this slot is unavailable.'
      });
      if (data.success) {
        toast.success(`Visit ${status}`);
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const kpis = [
    { label: 'Total Views', value: (stats.totalStats?.totalViews || 0).toLocaleString(), icon: Eye, color: 'blue', trend: `${(stats.trends?.totalViews || 0) > 0 ? '+' : ''}${stats.trends?.totalViews || 0}%`, up: (stats.trends?.totalViews || 0) >= 0 },
    { label: 'Unique Viewers', value: (stats.totalStats?.uniqueViewers || 0).toLocaleString(), icon: Users, color: 'indigo', trend: `${(stats.trends?.uniqueViewers || 0) > 0 ? '+' : ''}${stats.trends?.uniqueViewers || 0}%`, up: (stats.trends?.uniqueViewers || 0) >= 0 },
    { label: 'Inquiries', value: stats.totalStats?.inquiries || 0, icon: MessageCircle, color: 'purple', trend: `${(stats.trends?.inquiries || 0) > 0 ? '+' : ''}${stats.trends?.inquiries || 0}%`, up: (stats.trends?.inquiries || 0) >= 0, link: '/chat' },
    { label: 'Bookings', value: stats.totalStats?.bookings || 0, icon: CheckCircle2, color: 'green', trend: `${(stats.trends?.bookings || 0) > 0 ? '+' : ''}${stats.trends?.bookings || 0}%`, up: (stats.trends?.bookings || 0) >= 0 },
  ];

  const sidebarLinks = [
    { label: 'Overview', icon: LayoutDashboard, id: 'overview' },
    { label: 'My Listings', icon: Home, id: 'rooms', link: '/owner/rooms' },
    { label: 'Analytics', icon: BarChart3, id: 'analytics', link: '/owner/analytics' },
    { label: 'Visit Requests', icon: Calendar, id: 'visits', count: myVisits.filter(v => v.status === 'pending').length, link: '/visits' },
    { label: 'Messages', icon: MessageCircle, id: 'messages', link: '/chat' },
    { label: 'Support', icon: MessageSquare, id: 'support' },
    { label: 'Settings', icon: Settings, id: 'settings', link: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex h-screen overflow-hidden">

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-gray-100 shadow-sm z-30">
          <div className="p-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                <Home className="text-white" size={24} />
              </div>
              <span className="text-xl font-black tracking-tighter text-gray-900">StayHome<span className="text-blue-600">.</span></span>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {sidebarLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.link) navigate(item.link);
                  else setActiveTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'} />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === item.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-50">
            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <img src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">{user?.name}</p>
                {user?.customId && (
                  <p className="text-[9px] font-black text-blue-600 leading-none mt-1">ID: {user.customId}</p>
                )}
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Property Host</p>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-10">

          {/* Top Bar / Header */}
          <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-5 flex items-center justify-between z-20">
            <div>
              <h2 className="text-xl font-black text-gray-900">Owner Dashboard</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Performance Overview & Management</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search rooms, guests..."
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 w-64"
                />
              </div>
              <Link
                to="/owner/rooms/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
              >
                <Plus size={16} /> Add Listing
              </Link>
            </div>
          </header>

          <div className="p-8 space-y-8">
            {activeTab === 'support' ? (
              <SupportPanel />
            ) : (
              <>
                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {kpis.map((kpi, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => kpi.link && navigate(kpi.link)}
                      className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${kpi.link ? 'cursor-pointer hover:border-blue-100' : ''}`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12`}>
                            <kpi.icon size={24} />
                          </div>
                          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${kpi.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {kpi.trend}
                          </div>
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? '...' : kpi.value}</h3>
                      </div>
                      <div className={`absolute bottom-0 right-0 w-24 h-24 bg-${kpi.color}-50/30 rounded-full -mr-12 -mb-12 transition-transform group-hover:scale-110`} />
                    </motion.div>
                  ))}
                </div>

                {/* Middle Section: Analytics & Activity */}
                <div className="grid lg:grid-cols-12 gap-8">

                  {/* Analytics Chart */}
                  <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">Performance Trend</h3>
                        <p className="text-xs font-bold text-gray-400">Views and Inquiries over the last 7 days</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          className="bg-gray-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/10"
                        >
                          <option value="7">Last 7 Days</option>
                          <option value="30">Last 30 Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="h-80 w-full">
                      {analytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorInq" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                            />
                            <Tooltip
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="metrics.views"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorViews)"
                              name="Views"
                            />
                            <Area
                              type="monotone"
                              dataKey="metrics.inquiries"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorInq)"
                              name="Inquiries"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                          <BarChart3 size={48} className="text-gray-200" />
                          <p className="text-sm font-bold text-gray-400 italic">Gathering more data for your charts...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status / Quick Tools */}
                  <div className="lg:col-span-4 space-y-8">
                    {completion < 100 && (
                      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 relative overflow-hidden">
                        <ProfileCompletion showSteps={false} />
                      </div>
                    )}

                    <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-white/10 rounded-xl">
                            <TrendingUp size={20} className="text-blue-400" />
                          </div>
                          <h4 className="font-black text-sm uppercase tracking-widest">Growth Tip</h4>
                        </div>
                        <p className="text-sm font-bold text-gray-300 leading-relaxed mb-6">
                          Users respond 3x more to listings with verified high-quality floor plans.
                        </p>
                        <button className="text-xs font-black text-white px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                          Upgrade Listings
                        </button>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    </div>

                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                      <h4 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Filter size={14} /> Quick Analysis
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <span className="text-xs font-bold text-gray-600">Response Rate</span>
                          <span className="text-xs font-black text-green-600">98%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <span className="text-xs font-bold text-gray-600">Occupancy</span>
                          <span className="text-xs font-black text-blue-600">84%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Grid: Rooms & Requests */}
                <div className="grid lg:grid-cols-12 gap-8">

                  {/* Rooms Preview */}
                  <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">My Listings</h3>
                        <p className="text-xs font-bold text-gray-400">Preview of your published properties</p>
                      </div>
                      <Link to="/owner/rooms" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">
                        View All Rooms
                      </Link>
                    </div>

                    <div className="p-8 grid sm:grid-cols-2 gap-6">
                      {myRooms.length > 0 ? myRooms.slice(0, 4).map((room, i) => (
                        <div key={i} className="group border border-gray-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all">
                          <div className="h-40 relative">
                            <img
                              src={room.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=Property'}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              alt=""
                            />
                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md ${room.availability ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                              {room.availability ? 'Available' : 'Booked'}
                            </div>
                            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/30">
                              <p className="text-[8px] font-black text-white uppercase tracking-tighter">{room.roomType}</p>
                            </div>
                            <div className="absolute bottom-3 right-3 bg-white px-3 py-1 rounded-lg shadow-lg">
                              <p className="text-sm font-black text-gray-900">{formatCurrency(room.rent)}</p>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-gray-900 truncate">{room.title}</h4>
                            <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                              <MapPin size={12} />
                              <span className="text-[10px] font-bold truncate">{formatRoomAddress(room.location?.address)}</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Eye size={12} className="text-gray-400" />
                                  <span className="text-[10px] font-bold text-gray-600">{room.stats?.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar size={12} className="text-gray-400" />
                                  <span className="text-[10px] font-bold text-gray-600">{room.stats?.visitRequests || 0}</span>
                                </div>
                              </div>
                              <Link to={`/rooms/${room._id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                <ChevronRight size={16} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <Home className="mx-auto mb-4 text-gray-300" size={32} />
                          <p className="text-sm font-bold text-gray-500">No rooms listed yet.</p>
                          <Link to="/owner/rooms/new" className="text-xs font-black text-blue-600 uppercase tracking-widest mt-2 inline-block">Create Now</Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Requests */}
                  <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">Visit Requests</h3>
                        <p className="text-xs font-bold text-gray-400">Incoming booking and viewing requests</p>
                      </div>
                      <Link to="/visits" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">
                        Manage All
                      </Link>
                    </div>

                    <div className="p-2 space-y-1">
                      {myVisits.length > 0 ? myVisits.slice(0, 5).map((visit, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i}
                          className="p-4 rounded-2xl hover:bg-gray-50 group flex items-center gap-4 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 border border-white">
                            <img src={visit.student?.avatar?.url || `https://ui-avatars.com/api/?name=${visit.student?.name}`} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-black text-gray-900 truncate">{visit.student?.name}</h5>
                            <p className="text-[10px] font-bold text-gray-400 truncate mt-0.5">{visit.room?.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${visit.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                visit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {visit.status}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">• {new Date(visit.requestedDate).toLocaleDateString()}</span>
                              {visit.identityProof && (
                                <a
                                  href={visit.identityProof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-tighter hover:bg-blue-200 transition-colors"
                                >
                                  View ID
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {visit.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleRespond(visit._id, 'approved')}
                                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleRespond(visit._id, 'rejected')}
                                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="py-20 text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                            <Clock className="text-gray-300" size={24} />
                          </div>
                          <p className="text-sm font-bold text-gray-400 italic">No visit requests at the moment.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </main>

      </div>
    </div>
  );
};

export default OwnerDashboard;
