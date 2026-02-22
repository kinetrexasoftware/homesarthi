import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Home, MapPin, ShieldCheck, Mail,
  ChevronRight, ArrowRight, CheckCircle,
  XCircle, Image as ImageIcon, Briefcase,
  Users, Layers, Zap, Info, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Loader from '../common/Loader';
import RoomMapView from '../rooms/RoomMapView';

const PendingRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const ownerId = searchParams.get('owner');

  useEffect(() => {
    fetchPendingRooms();
  }, [location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const roomId = searchParams.get('id');
    if (roomId && rooms.length > 0) {
      const roomToSelect = rooms.find(r => r._id === roomId);
      if (roomToSelect) {
        setSelectedRoom(roomToSelect);
      }
    }
  }, [location.search, rooms]);

  const fetchPendingRooms = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams(location.search);
      const ownerId = searchParams.get('owner');

      const endpoint = ownerId
        ? `/admin/rooms/pending?owner=${ownerId}`
        : '/admin/rooms/pending';

      const response = await api.get(endpoint);
      setRooms(response.data.data.rooms || []);
    } catch (error) {
      toast.error('Listing queue fetch failed.');
    } finally {
      setLoading(false);
    }
  };

  const processListing = async (action) => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Rejection rationale is mandatory.');
      return;
    }

    try {
      setActionLoading(true);
      const endpoint = `/admin/rooms/${selectedRoom._id}/${action}`;
      await api.put(endpoint, action === 'reject' ? { reason: rejectionReason } : {});

      toast.success(`Listing ${action.toUpperCase()} complete.`);
      setRooms(prev => prev.filter(r => r._id !== selectedRoom._id));
      setSelectedRoom(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Authorization or processing hardware error.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader size="large" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]">
      {/* Left Pane: Quality Queue */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-[#FDFDFE]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Quality Gate Queue</h3>
            {ownerId && (
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('owner');
                  setSearchParams(newParams);
                }}
                className="text-blue-600 hover:text-blue-700 transition-colors"
                title="Clear Filter"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rooms.length} Listings {ownerId ? 'for this Owner' : 'Pending Vetting'}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {rooms.map(room => (
            <motion.div
              key={room._id}
              onClick={() => setSelectedRoom(room)}
              whileHover={{ x: 4 }}
              className={`p-6 rounded-[2.2rem] border transition-all cursor-pointer group relative overflow-hidden ${selectedRoom?._id === room._id
                ? 'border-blue-400 bg-blue-50/40 shadow-xl shadow-blue-600/5'
                : 'border-gray-50 bg-white hover:border-gray-200 hover:shadow-lg'
                }`}
            >
              <div className="flex gap-5 relative z-10">
                <div className="w-20 h-20 rounded-[1.5rem] bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                  <img src={room.images?.[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate mb-1">{room.title}</h4>
                  <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                    <MapPin size={10} className="text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">{room.location?.address?.city || 'Deoria'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-black text-blue-600 tracking-tight">₹{room.rent?.amount?.toLocaleString()}</span>
                    <span className="px-3 py-1 bg-gray-100 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-full text-[9px] font-black uppercase text-gray-500 transition-colors">{room.roomType}</span>
                  </div>
                </div>
              </div>
              {selectedRoom?._id === room._id && (
                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Pane: Verification Suite */}
      <div className="lg:col-span-8 overflow-y-auto pr-2">
        <AnimatePresence mode="wait">
          {selectedRoom ? (
            <motion.div
              key={selectedRoom._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 pb-10"
            >
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center border border-blue-100 shadow-sm">
                      <Home size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedRoom.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">Reference: {selectedRoom._id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => processListing('approve')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-600/20 transition-all">
                      <CheckCircle size={16} /> Authorize Listing
                    </button>
                    <button onClick={() => processListing('reject')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all">
                      <XCircle size={16} /> Decline
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Visual & Location Vetting */}
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <ImageIcon size={16} className="text-blue-600" /> Visual Assets
                        </h4>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">{selectedRoom.images?.length || 0} Files</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedRoom.images?.map((img, i) => (
                          <a key={i} href={img.url} target="_blank" rel="noreferrer" className="aspect-square rounded-[1.5rem] overflow-hidden bg-gray-50 border border-gray-100 block hover:border-blue-200 transition-colors group">
                            <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {selectedRoom.verification?.electricBill && (
                      <div className="space-y-6 pt-8 border-t border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Zap size={16} className="text-amber-500" /> Utility Verification
                        </h4>
                        <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100/50">
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-4">Electric Utility Bill Vetting</p>
                          <a href={selectedRoom.verification.electricBill.url} target="_blank" rel="noreferrer" className="relative block group rounded-[1.8rem] overflow-hidden border-4 border-white shadow-2xl shadow-amber-900/10">
                            <img src={selectedRoom.verification.electricBill.url} className="w-full h-auto max-h-[300px] object-contain bg-white" alt="Electric Bill" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Full Inspection</span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedRoom.verification?.aadhaarCard && (
                      <div className="space-y-6 pt-8 border-t border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <FileText size={16} className="text-blue-600" /> Identity Verification
                        </h4>
                        <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50">
                          <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-4">Owner's Aadhaar Card Vetting</p>
                          <a href={selectedRoom.verification.aadhaarCard.url} target="_blank" rel="noreferrer" className="relative block group rounded-[1.8rem] overflow-hidden border-4 border-white shadow-2xl shadow-blue-900/10">
                            <img src={selectedRoom.verification.aadhaarCard.url} className="w-full h-auto max-h-[300px] object-contain bg-white" alt="Aadhaar Card" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Full Inspection</span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6 pt-8 border-t border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" /> Geospatial Vetting
                      </h4>
                      <div className="rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm">
                        <RoomMapView room={selectedRoom} height="400px" isAdmin={true} />
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Owner Vetting */}
                  <div className="space-y-12">
                    <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 relative overflow-hidden">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Host Identity Context</h4>
                      <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-200/50">
                        <div className="w-16 h-16 rounded-[1.8rem] bg-white overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                          <img src={selectedRoom.owner?.avatar?.url || `https://ui-avatars.com/api/?name=${selectedRoom.owner?.name}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-gray-900 uppercase tracking-tight truncate">{selectedRoom.owner?.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {selectedRoom.owner?.verified ? (
                              <span className="flex items-center gap-1 text-green-600 text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck size={12} /> KYC Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                <Zap size={12} className="fill-amber-500" /> Pending KYC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div className="flex justify-between items-center group">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered Email</span>
                          <span className="text-[11px] font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate ml-4 uppercase">{selectedRoom.owner?.email}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Encrypted Mobile</span>
                          <span className="text-[11px] font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{selectedRoom.owner?.phone || 'Not Logged'}</span>
                        </div>
                      </div>
                      <Briefcase size={60} className="absolute -right-6 -top-6 text-gray-900/5 -rotate-12" />
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">High-Level Audits</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-7 bg-blue-600 text-white rounded-[2.5rem] shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100/80 mb-2">Listing Value</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black italic">₹{selectedRoom.rent?.amount?.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest">/ monthly</span>
                          </div>
                          <Zap size={40} className="absolute -right-4 -bottom-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="p-7 bg-gray-900 text-white rounded-[2.5rem] shadow-2xl shadow-gray-900/10 relative overflow-hidden group">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Class Audit</p>
                          <p className="text-2xl font-black uppercase truncate tracking-tight">{selectedRoom.roomType}</p>
                          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{selectedRoom.amenities?.length || 0} Features</p>
                          <Layers size={40} className="absolute -right-4 -bottom-4 text-white/10 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Decline Log (Public Feedback)</h4>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide professional evidence if declining this listing. This will be visible to the host."
                        className="w-full bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 text-xs font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none shadow-inner min-h-[220px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Block */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Host's Listing Disclosure</h4>
                <div className="text-sm font-bold text-gray-500 leading-relaxed italic p-8 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                  "{selectedRoom.description}"
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center text-gray-100 mb-8 border border-gray-50">
                <ShieldCheck size={48} />
              </div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Vetting Standby</h3>
              <p className="text-[11px] font-bold text-gray-300 max-w-xs uppercase tracking-[0.1em] leading-relaxed">
                Choose a listing from the quality queue to initiate a comprehensive security verification sequence
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PendingRooms;
