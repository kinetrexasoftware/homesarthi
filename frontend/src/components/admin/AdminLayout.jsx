import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Home, AlertTriangle,
    Settings, LogOut, Menu, X, Shield, Bell, Search,
    BarChart3, History, CheckCircle, ArrowRight, Loader2, ShieldCheck, Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ users: [], rooms: [], reports: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);

    const { user, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
        { icon: Users, label: 'User Governance', path: '/admin/users' },
        { icon: ShieldCheck, label: 'Owner Verification', path: '/admin/users?role=owner&status=unverified' },
        { icon: Home, label: 'Listing Quality', path: '/admin/rooms' },
        { icon: AlertTriangle, label: 'Trust & Safety', path: '/admin/reports' },
        { icon: Headphones, label: 'Support Requests', path: '/admin/support' },
        { icon: History, label: 'Audit Logs', path: '/admin/audit' },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch();
            } else {
                setSearchResults({ users: [], rooms: [], reports: [] });
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const performSearch = async () => {
        try {
            setIsSearching(true);
            const response = await api.get(`/admin/search?query=${searchQuery}`);
            setSearchResults(response.data.data);
            setShowResults(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleResultClick = (path) => {
        navigate(path);
        setShowResults(false);
        setSearchQuery('');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#FDFDFE] flex">
            {/* Sidebar - Desktop */}
            <aside className={`fixed left-0 bottom-0 top-20 bg-white border-r border-gray-100 transition-all duration-300 z-50 hidden md:block ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                            <Shield size={18} />
                        </div>
                        {isSidebarOpen && (
                            <span className="font-black text-xl tracking-tight text-gray-900">ROOMATE<span className="text-blue-600 underline decoration-blue-200 underline-offset-4 decoration-4">ADMIN</span></span>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {menuItems.map((item) => {
                            const currentPath = location.pathname + location.search;
                            const isActive = item.path.includes('?')
                                ? currentPath === item.path
                                : location.pathname === item.path && !location.search.includes('role=owner&status=unverified');

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive
                                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon size={20} className={isActive ? 'text-blue-600' : 'group-hover:text-gray-900'} />
                                    {isSidebarOpen && <span className="font-black text-[11px] uppercase tracking-widest leading-none">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 mt-auto">
                        <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-2xl ${!isSidebarOpen && 'justify-center'}`}>
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-100 flex items-center justify-center shrink-0">
                                <img src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${user?.name}`} alt="" />
                            </div>
                            {isSidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tight">{user?.name}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Administrator</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-4 py-4 text-red-400 hover:text-red-500 transition-colors mt-2 ${!isSidebarOpen && 'justify-center'}`}
                        >
                            <LogOut size={20} />
                            {isSidebarOpen && <span className="font-black text-[11px] uppercase tracking-widest">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                {/* Top bar */}
                <header className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="relative hidden sm:block flex-1 max-w-md" ref={searchRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                                placeholder="Global Command Search (Ctrl + K)"
                                className="pl-10 pr-4 py-2.5 bg-gray-50/50 rounded-xl border-none outline-none text-xs font-bold w-full placeholder:text-gray-300 focus:ring-2 focus:ring-blue-100 transition-all"
                            />

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {showResults && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-blue-900/10 overflow-hidden z-50 max-h-[70vh] flex flex-col"
                                    >
                                        <div className="overflow-y-auto p-4 space-y-6">
                                            {isSearching ? (
                                                <div className="py-10 flex flex-col items-center justify-center gap-4 text-gray-300">
                                                    <Loader2 className="animate-spin" size={24} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Scanning Registry...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Users */}
                                                    {searchResults.users.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="px-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">User Governance</h4>
                                                            {searchResults.users.map(u => (
                                                                <div
                                                                    key={u._id}
                                                                    onClick={() => handleResultClick(`/admin/users?id=${u._id}&role=${u.role}&status=${u.status}`)}
                                                                    className="p-3 hover:bg-gray-50 rounded-2xl cursor-pointer flex items-center gap-4 group transition-all"
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                                                                        {u.name[0]}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-black text-gray-900 truncate uppercase">{u.name}</p>
                                                                        <p className="text-[9px] font-bold text-gray-400 truncate">{u.email}</p>
                                                                    </div>
                                                                    <ArrowRight size={14} className="text-gray-200 group-hover:text-blue-600 transition-colors" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Rooms */}
                                                    {searchResults.rooms.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="px-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Listing Quality</h4>
                                                            {searchResults.rooms.map(r => (
                                                                <div
                                                                    key={r._id}
                                                                    onClick={() => handleResultClick(`/admin/rooms?id=${r._id}`)}
                                                                    className="p-3 hover:bg-gray-50 rounded-2xl cursor-pointer flex items-center gap-4 group transition-all"
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-green-50 overflow-hidden flex items-center justify-center">
                                                                        {r.images?.[0]?.url ? <img src={r.images[0].url} className="w-full h-full object-cover" /> : <Home size={16} className="text-green-600" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-black text-gray-900 truncate uppercase">{r.title}</p>
                                                                        <p className="text-[9px] font-bold text-gray-400 truncate uppercase">{r.location.address.city}, {r.location.address.state}</p>
                                                                    </div>
                                                                    <ArrowRight size={14} className="text-gray-200 group-hover:text-green-600 transition-colors" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Reports */}
                                                    {searchResults.reports.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="px-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Trust & Safety</h4>
                                                            {searchResults.reports.map(rep => (
                                                                <div
                                                                    key={rep._id}
                                                                    onClick={() => handleResultClick(`/admin/reports?id=${rep._id}&status=${rep.status}`)}
                                                                    className="p-3 hover:bg-gray-50 rounded-2xl cursor-pointer flex items-center gap-4 group transition-all"
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                                                        <AlertTriangle size={16} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-black text-gray-900 truncate uppercase">{rep.reason.replace(/_/g, ' ')}</p>
                                                                        <p className="text-[9px] font-bold text-gray-400 truncate uppercase">Incident Target: {rep.reportType}</p>
                                                                    </div>
                                                                    <ArrowRight size={14} className="text-gray-200 group-hover:text-red-600 transition-colors" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {searchResults.users.length === 0 && searchResults.rooms.length === 0 && searchResults.reports.length === 0 && (
                                                        <div className="py-10 text-center space-y-2">
                                                            <Search size={32} className="mx-auto text-gray-100" />
                                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Matches Found</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Shift + Click to open in new tab</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl relative">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden sm:block"></div>
                        <div className="hidden sm:flex items-center gap-3 bg-green-50 px-4 py-2 rounded-xl text-green-700">
                            <CheckCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around md:hidden z-50">
                {menuItems.slice(0, 4).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-blue-600' : 'text-gray-400'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="text-[8px] font-black uppercase tracking-tight">{item.label.split(' ')[0]}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default AdminLayout;

