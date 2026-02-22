import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users, ShieldCheck, Mail, Phone, Calendar,
  MoreVertical, ShieldAlert, CheckCircle, XCircle,
  Eye, Scale, ArrowRight, Trash2, Ban, Zap, MapPin, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Loader from '../common/Loader';

const UserManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'governance'

  const [filters, setFilters] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      role: searchParams.get('role') || 'owner',
      status: searchParams.get('status') || 'all',
      search: ''
    };
  });
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('id');
    const userRole = searchParams.get('role');
    const userStatus = searchParams.get('status');

    if (userId) {
      // Direct lookup: reset other filters to ensure we find the user
      setFilters(prev => ({
        ...prev,
        id: userId,
        role: 'all',
        status: 'all'
      }));
    } else if (userRole || userStatus) {
      setFilters(prev => {
        const newRole = userRole || prev.role;
        const newStatus = userStatus || prev.status;
        const { id, ...rest } = prev; // Remove ID if not in URL
        if (prev.role === newRole && prev.status === newStatus && !prev.id) return prev;
        return { ...rest, role: newRole, status: newStatus };
      });
    }
  }, [location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('id');

    if (userId) {
      if (users.length > 0) {
        const userToSelect = users.find(u => u._id === userId);
        if (userToSelect) {
          setSelectedUser(userToSelect);
          setViewMode('governance');
        }
      }
    } else {
      setSelectedUser(null);
      setViewMode('list');
    }
  }, [location.search, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await api.get(`/admin/users?${queryParams}`);
      setUsers(response.data.data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleGovernanceAction = async (action) => {
    if (!actionReason.trim() && action !== 'activate' && action !== 'approve') {
      toast.error('Reason is mandatory for this directive.');
      return;
    }

    try {
      const endpoint = `/admin/users/${selectedUser._id}/${action}`;
      await api.put(endpoint, { reason: actionReason });
      toast.success(`Directive ${action.toUpperCase()} executed.`);
      fetchUsers();
      setViewMode('list');
      setSelectedUser(null);
      setActionReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authorization error.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" /> User Governance
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Trust Layer Management & Identity Verification</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {['owner', 'student', 'all'].map(role => (
              <button
                key={role}
                onClick={() => setFilters({ ...filters, role })}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.role === role ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
              >
                {role}
              </button>
            ))}
          </div>
          {filters.role === 'owner' && (
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, status: 'unverified' })}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filters.status === 'unverified' ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-gray-400 border border-gray-100'}`}
              >
                Unverified
              </button>
              <button
                onClick={() => setFilters({ ...filters, status: 'all' })}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filters.status === 'all' ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-400 border border-gray-100'}`}
              >
                All Status
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {users.map(user => (
              <div
                key={user._id}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => { setSelectedUser(user); setViewMode('governance'); }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100">
                    <img src={user.avatar?.url || `https://ui-avatars.com/api/?name=${user.name}`} alt="" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-[12px] tracking-tight">{user.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
                      {user.customId && (
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">#{user.customId}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Mail size={14} className="text-blue-600" />
                    <span className="text-[11px] font-bold truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <Calendar size={14} className="text-blue-600" />
                    <span className="text-[11px] font-bold">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <MapPin size={14} className="text-blue-600" />
                    <span className="text-[11px] font-bold truncate">
                      {user.location?.city ? `${user.location.city}, ${user.location.state || ''}` : 'No Location'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {user.status}
                  </div>
                  <div className="flex items-center gap-3">
                    {user.role === 'owner' && (
                      <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        <Home size={12} />
                        <span className="text-[10px] font-black">{user.listingCount || 0} Listings</span>
                      </div>
                    )}
                    {user.verified && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {user.role === 'owner' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/rooms?owner=${user._id}&tab=active`);
                    }}
                    className="mt-4 w-full py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 absolute bottom-4 left-0 right-0 mx-6 translate-y-4 group-hover:translate-y-0 duration-300 shadow-lg"
                  >
                    View All Listings <ArrowRight size={12} />
                  </button>
                )}

                <div className="absolute top-4 right-4 p-2 bg-gray-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <Scale size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="governance"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left: Identity Split */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <button onClick={() => setViewMode('list')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:text-gray-900 transition-colors">
                  <ArrowRight size={14} className="rotate-180" /> Back to Registry
                </button>
                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  CID: {selectedUser?.customId || selectedUser?._id.slice(-8)}
                </div>
              </div>

              <div className="flex items-center gap-6 overflow-hidden">
                <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shrink-0">
                  <img src={selectedUser.avatar?.url || `https://ui-avatars.com/api/?name=${selectedUser.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight break-words">{selectedUser.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500">{selectedUser.role}</span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedUser.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-gray-50">
                <div className="p-6 bg-gray-50 rounded-3xl overflow-hidden">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Primary Email</label>
                  <p className="text-sm font-bold text-gray-900 break-all">{selectedUser.email}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl overflow-hidden">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Phone System</label>
                  <p className="text-sm font-bold text-gray-900">{selectedUser.phone || 'Undeclared'}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl overflow-hidden sm:col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Registered Location</label>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    {selectedUser.location?.city ? `${selectedUser.location.city}, ${selectedUser.location.state} ${selectedUser.location.pincode ? `(${selectedUser.location.pincode})` : ''}` : 'Location Data Not Available'}
                  </p>
                </div>
              </div>

              {/* Verification Docs */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" /> Identity Documents
                </h4>
                {selectedUser.verificationDocuments?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.verificationDocuments.map((doc, idx) => (
                      <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="block relative group aspect-video rounded-2xl overflow-hidden bg-gray-100">
                        <img src={doc.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={24} className="text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No documents uploaded for review</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions Split */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 rounded-[2.5rem] shadow-2xl text-white">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-8">
                  <Zap className="text-yellow-400" size={18} /> Moderation Controls
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-3">Action Reason</label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Why are you taking this moderation action? (Visible to User)"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:bg-white/10 transition-all outline-none resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUser.role === 'owner' && !selectedUser.verified && (
                      <button
                        onClick={() => handleGovernanceAction('approve')}
                        className="flex items-center justify-center gap-2 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                      >
                        <CheckCircle size={14} /> Verify Owner
                      </button>
                    )}
                    {selectedUser.status === 'active' ? (
                      <button
                        onClick={() => handleGovernanceAction('suspend')}
                        className="flex items-center justify-center gap-2 py-5 bg-red-600/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Ban size={14} /> Suspend User
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGovernanceAction('activate')}
                        className="flex items-center justify-center gap-2 py-5 bg-green-600 hover:bg-green-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-green-600/20 text-white"
                      >
                        <CheckCircle size={14} /> Reactivate User
                      </button>
                    )}
                    <button
                      onClick={() => handleGovernanceAction('delete')}
                      className="flex items-center justify-center gap-2 py-5 bg-gray-700 hover:bg-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Trash2 size={14} /> Delete Account
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-6">Security Context</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-400 uppercase tracking-tighter">Auto-Moderation Tier</span>
                    <span className="text-blue-600 uppercase">Standard Governance</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-400 uppercase tracking-tighter">Identity Confidence</span>
                    <span className={selectedUser.verified ? 'text-green-600 capitalize' : 'text-red-600 capitalize'}>
                      {selectedUser.verified ? 'High-Trust Verified' : 'Unverified Identity'}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-[-10px] right-[-10px] opacity-5">
                  <ShieldAlert size={120} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
