import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, MessageCircle, User, LogOut, Menu, X, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';

import logo from '../../assets/logo.png';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'student': return '/student/dashboard';
      case 'owner': return '/owner/dashboard';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-blue-600 font-black">HS</span>';
                }}
              />
            </div>
            <span className="text-2xl font-black tracking-tighter block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              HomeSarthi
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Home size={18} />
              <span>Home</span>
            </Link>

            <Link
              to="/rooms"
              className="flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Search size={18} />
              <span>Explore</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/chat"
                  className="flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle size={18} />
                  <span>Messages</span>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 pl-4 border-l border-gray-100 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-[2px] transition-transform group-hover:scale-105">
                      <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100">
                        {user?.avatar?.url ? (
                          <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-600 font-black text-sm">
                            {user?.name?.[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-black text-gray-900 leading-none">{user?.name}</p>
                      {user?.customId && (
                        <p className="text-[9px] font-bold text-blue-600 leading-none mt-1">ID: {user.customId}</p>
                      )}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 capitalize">{user?.role}</p>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Info</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all"
                          >
                            <User size={18} /> Profile Details
                          </Link>
                          <Link
                            to={getDashboardLink()}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all"
                          >
                            <LayoutDashboard size={18} /> Dashboard
                          </Link>
                          <Link
                            to="/profile" // Point to profile hub for settings
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all"
                          >
                            <Settings size={18} /> Settings
                          </Link>
                        </div>
                        <div className="p-2 border-t border-gray-50">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <LogOut size={18} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-all">
                  Sign In
                </Link>
                <Link to="/register" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link
                to="/"
                className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <Home size={20} className="text-blue-600" />
                </div>
                <span className="font-bold">Home</span>
              </Link>

              <Link
                to="/rooms"
                className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <Search size={20} className="text-blue-600" />
                </div>
                <span className="font-bold">Explore Rooms</span>
              </Link>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-gray-100 space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Menu</p>
                    <Link
                      to="/chat"
                      className="flex items-center space-x-3 p-2 text-gray-600 font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle size={20} />
                      <span>Messages</span>
                    </Link>
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center space-x-3 p-2 text-gray-600 font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={20} />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 p-2 text-gray-600 font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={20} />
                      <span>Profile Hub</span>
                    </Link>
                  </div>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 p-4 rounded-2xl bg-red-50 w-full text-red-600 font-bold"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/login"
                    className="py-4 text-center bg-gray-50 rounded-2xl font-bold text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="py-4 text-center bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

