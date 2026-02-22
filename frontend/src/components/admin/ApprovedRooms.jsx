import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Home, MapPin, Search, Eye, Filter,
    Building, Map as MapIcon, Calendar,
    CheckCircle, ArrowUpRight, XCircle, User, Zap
} from 'lucide-react';
import api from '../../utils/api';
import Loader from '../common/Loader';
import { formatCurrency } from '../../utils/helpers';

const ApprovedRooms = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const ownerId = searchParams.get('owner');

    useEffect(() => {
        fetchRooms();
    }, [ownerId]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const endpoint = ownerId
                ? `/admin/rooms?status=approved&limit=100&owner=${ownerId}`
                : '/admin/rooms?status=approved&limit=100';

            const { data } = await api.get(endpoint);
            setRooms(data.data.rooms || []);
        } catch (error) {
            console.error('Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.title.toLowerCase().includes(search.toLowerCase()) ||
        room.location?.address?.city?.toLowerCase().includes(search.toLowerCase())
    );

    const availableRooms = filteredRooms.filter(room => !room.rentedInfo);
    const bookedRooms = filteredRooms.filter(room => room.rentedInfo);

    if (loading) return <div className="p-20 flex justify-center"><Loader size="large" /></div>;

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search active listings..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>
                    {ownerId && (
                        <button
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.delete('owner');
                                setSearchParams(newParams);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                        >
                            Filtering by Owner <XCircle size={14} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle size={14} /> {availableRooms.length} Available
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} /> {bookedRooms.length} Booked
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Available Rooms Grid - Main Content */}
                <div className="lg:col-span-8">
                    <div className="mb-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-1">
                            Live Inventory <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] text-gray-500">{availableRooms.length}</span>
                        </h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Properties currently available for students</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {availableRooms.map(room => (
                            <div key={room._id} className="bg-white rounded-[2rem] border border-gray-100 p-6 hover:shadow-lg transition-all group h-full flex flex-col">
                                <div className="aspect-video bg-gray-100 rounded-2xl mb-6 overflow-hidden relative">
                                    <img src={room.images[0]?.url} alt={room.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {room.roomType}
                                    </div>
                                </div>

                                <div className="mb-6 flex-1">
                                    <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-1">{room.title}</h3>
                                    <div className="flex items-center gap-2 text-gray-400 mb-4">
                                        <MapPin size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wide line-clamp-1">{room.location.address.city}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-black text-blue-600">{formatCurrency(room.rent.amount)}<span className="text-xs text-gray-400 font-bold">/mo</span></span>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <Eye size={12} /> {room.stats?.views || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-6 border-t border-gray-50 mt-auto">
                                    <button
                                        onClick={() => navigate(`/rooms/${room._id}`)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                    >
                                        <ArrowUpRight size={14} /> View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                        {availableRooms.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-[2.5rem]">
                                <Home className="mx-auto text-gray-200 mb-4" size={48} />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">No available listings found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booked Rooms - Sidebar */}
                <div className="lg:col-span-4 space-y-6 sticky top-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="mb-8">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <Zap className="text-blue-600" size={18} /> Occupancy Trail
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Rented properties & tenant logs</p>
                        </div>

                        <div className="space-y-4">
                            {bookedRooms.map(room => (
                                <div key={room._id} className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-100 hover:bg-white transition-all group">
                                    <div className="flex gap-4 items-center mb-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-200 overflow-hidden shrink-0 border border-white shadow-sm">
                                            <img src={room.images[0]?.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{room.title}</h4>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">₹{room.rent.amount.toLocaleString()}/mo</p>
                                        </div>
                                    </div>

                                    {/* Tenant Info */}
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 overflow-hidden">
                                            <img src={room.rentedInfo?.student?.avatar?.url || `https://ui-avatars.com/api/?name=${room.rentedInfo?.student?.name}`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Tenant Identified</p>
                                            <p className="text-[11px] font-black text-gray-900 truncate uppercase mt-1">{room.rentedInfo?.student?.name || 'Anonymous'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between px-2">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            Rented {new Date(room.rentedInfo?.updatedAt).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => navigate(`/rooms/${room._id}`)}
                                            className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                        >
                                            Audit
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {bookedRooms.length === 0 && (
                                <div className="py-10 text-center opacity-30">
                                    <Zap className="mx-auto mb-2" size={32} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">No occupied units</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Helper */}
                    <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-600/20 text-white relative overflow-hidden group">
                        <Zap size={80} className="absolute -right-4 -bottom-4 text-white/10 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-blue-100">Market Occupancy</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black">{((bookedRooms.length / (filteredRooms.length || 1)) * 100).toFixed(0)}%</span>
                            <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Utilization Rate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovedRooms;
