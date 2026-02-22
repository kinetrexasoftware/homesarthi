import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Edit2, Camera, ShieldCheck, Star,
  Settings, Save, X, Lock, Trash2, Smartphone, LogOut,
  Shield, AlertTriangle, ChevronRight
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ProfileCompletion from '../components/common/ProfileCompletion';
import { compressImage } from '../utils/imageCompression';
import { Link, useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'settings'
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');
  const fileInputRef = useRef(null);

  // Settings specific state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  // Sync state if user changes (e.g., after refreshUser call completes)
  useEffect(() => {
    if (user && !editing) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      setAvatarPreview(user.avatar?.url || '');
    }
  }, [user, editing]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('File too large (max 2MB)');
    }

    try {
      const compressedBlob = await compressImage(file);
      setAvatarFile(compressedBlob);
      setAvatarPreview(URL.createObjectURL(compressedBlob));
      setEditing(true); // Automatically enter edit mode
      toast.success('Image selected! Click Save to finish.');
    } catch (err) {
      toast.error('Failed to process image');
    }
  };

  const handleAddClick = (type) => {
    if (type === 'photo') {
      fileInputRef.current?.click();
    } else {
      setActiveTab('profile');
      setEditing(true);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append('name', formData.name);
      dataToSend.append('phone', formData.phone);
      dataToSend.append('bio', formData.bio);

      if (avatarFile) {
        dataToSend.append('avatar', avatarFile, 'avatar.jpg');
      }

      const { data } = await api.put('/users/profile', dataToSend);

      if (data.success) {
        updateUser(data.data.user);
        toast.success('Profile updated successfully!');
        setEditing(false);
        setAvatarFile(null);
      }
    } catch (error) {
      console.error('Update Error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
    setAvatarPreview(user?.avatar?.url || '');
    setAvatarFile(null);
  };

  // Settings Handlers
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords don't match");
    }
    setLoading(true);
    try {
      await api.put('/users/change-password', passwordData);
      toast.success('Password updated successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalLogout = async () => {
    if (!window.confirm('This will log you out from all other browsers and devices. Continue?')) return;
    setLoading(true);
    try {
      await api.post('/users/logout-all');
      toast.success('Other sessions invalidated');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/users/delete-account');
      toast.success('Account deleted permanently');
      logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <AnimatePresence>
        {editing && activeTab === 'profile' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-blue-600 text-white px-6 py-4 rounded-3xl shadow-xl shadow-blue-600/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold">You're in Edit Mode</h4>
                  <p className="text-blue-100 text-xs">Don't forget to save your changes before leaving.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? 'Saving...' : <><Save size={18} /> Save Now</>}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Avatar & Quick Info */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

            <div className="relative inline-block group mb-6">
              <div
                className={`w-36 h-36 rounded-full overflow-hidden ring-4 ring-blue-50 bg-gray-50 mx-auto relative ${editing ? 'ring-blue-500 transition-all cursor-pointer' : ''}`}
                onClick={() => {
                  if (activeTab !== 'profile') setActiveTab('profile');
                  if (editing) fileInputRef.current?.click();
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user?.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-600 bg-blue-50">
                    {user?.name?.[0]}
                  </div>
                )}

                {editing && activeTab === 'profile' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={32} />
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
                id="profile-upload-input"
              />

              <label
                htmlFor="profile-upload-input"
                className="absolute bottom-1 right-1 p-3 bg-gray-900 text-white rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg border-4 border-white"
                onClick={() => setActiveTab('profile')}
              >
                <Camera size={18} />
              </label>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            {user?.customId && (
              <p className="text-xs font-bold text-blue-600 bg-blue-50 w-fit mx-auto px-3 py-1 rounded-full mt-2">
                ID: {user.customId}
              </p>
            )}
            <p className="text-gray-500 mt-2 flex items-center justify-center gap-1.5 capitalize text-sm">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              {user?.role} Account
            </p>

            {editing && avatarFile && activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100"
              >
                <p className="text-xs font-bold text-green-700 mb-3">New photo selected!</p>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                >
                  {loading ? 'Saving...' : <><Save size={18} /> Update Photo</>}
                </button>
              </motion.div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Auth Method</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {user?.googleId ? (
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
                  ) : <User size={14} className="text-blue-600" />}
                  <span className="text-sm font-semibold">{user?.googleId ? 'Google' : 'Password'}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className={`p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
              >
                <Settings size={20} />
              </button>
            </div>
          </motion.div>

          {!editing && <ProfileCompletion onAdd={handleAddClick} />}
        </div>

        {/* Right Column: Details & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Security Settings
            </button>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            {activeTab === 'profile' ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                    <p className="text-gray-500 text-sm">Keep your details up to date.</p>
                  </div>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all"
                    >
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          readOnly={!editing}
                          required
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all ${editing ? 'bg-white border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          readOnly={!editing}
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all ${editing ? 'bg-white border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        value={user?.email}
                        disabled
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-transparent bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <ShieldCheck size={18} className="text-green-500" title="Verified" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Short Bio</label>
                    <textarea
                      name="bio"
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={handleChange}
                      readOnly={!editing}
                      maxLength={200}
                      className={`w-full p-4 h-32 rounded-2xl border outline-none transition-all resize-none ${editing ? 'bg-white border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-gray-50 border-transparent text-gray-400'}`}
                    />
                    <AnimatePresence>
                      {editing && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-right text-xs text-gray-400 mt-2"
                        >
                          {formData.bio.length}/200 characters
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {editing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 pt-4"
                    >
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-8 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-2"
                      >
                        <X size={18} /> Cancel
                      </button>
                    </motion.div>
                  )}
                </form>
              </>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Security & Account</h3>
                  <p className="text-gray-500 text-sm">Manage your security and privacy settings.</p>
                </div>

                {/* Connected Accounts */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Smartphone size={18} className="text-blue-600" /> Connected Authentication
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {user?.googleId ? (
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-8 h-8" alt="Google" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <Lock size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {user?.googleId ? 'Google Account' : 'Email & Password'}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded-full">Active</span>
                  </div>
                </div>

                {/* Password Change */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-blue-600" /> {user?.googleId ? 'Set Password' : 'Update Password'}
                  </h4>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {!user?.googleId && (
                      <input
                        type="password"
                        placeholder="Current Password"
                        autoComplete="current-password"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        required
                      />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="password"
                        placeholder="New Password"
                        autoComplete="new-password"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        autoComplete="new-password"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Lock size={18} /> {loading ? 'Updating...' : 'Save New Password'}
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} /> Danger Zone
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-red-100 bg-red-50/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Logout All Devices</p>
                        <p className="text-[10px] text-gray-500">Secure your account</p>
                      </div>
                      <button onClick={handleGlobalLogout} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all">
                        <LogOut size={18} />
                      </button>
                    </div>
                    <div className="p-4 rounded-2xl border border-red-100 bg-red-50/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-red-700">Delete Account</p>
                        <p className="text-[10px] text-red-500">Permanent action</p>
                      </div>
                      <button onClick={() => setShowDeleteModal(true)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900">Are you sure?</h3>
            <p className="text-sm text-center text-gray-500 mt-2">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;