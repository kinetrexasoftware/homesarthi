import { useState, useEffect } from 'react';
import {
    Search, Filter, Clock, CheckCircle,
    AlertCircle, ChevronRight, Send, Headphones,
    Users, MessageSquare, AlertTriangle, ShieldCheck,
    X, Mail, ShieldX, ExternalLink, Phone, Home
} from 'lucide-react'; // icons verified
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import supportApi from '../../utils/supportApi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow, isValid } from 'date-fns';
import Loader from '../common/Loader';

const safeFormatDistance = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isValid(d) ? formatDistanceToNow(d) : 'Invalid date';
};

const AdminSupport = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category: '',
        page: 1
    });

    // Action State
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchTickets();
        fetchStats();
    }, [filters]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data } = await supportApi.getAllTickets(filters);
            setTickets(data.data.tickets);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await supportApi.getStats();
            setStats(data.data);
        } catch (error) { }
    };

    const selectTicket = async (ticket) => {
        try {
            const { data } = await supportApi.getTicketById(ticket._id);
            setSelectedTicket(data.data);
            setNewStatus(data.data.status);
            setShowDetail(true);
        } catch (error) { }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            setIsSubmitting(true);
            const { data } = await supportApi.addReply(selectedTicket._id, { message: replyMessage });

            const updatedTicket = { ...selectedTicket };
            updatedTicket.responses.push({
                ...data.data,
                user: { name: 'Admin Support' }
            });
            setSelectedTicket(updatedTicket);
            setReplyMessage('');
            toast.success('Response sent');
        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        try {
            setIsSubmitting(true);
            await supportApi.updateStatus(selectedTicket._id, { status });
            setSelectedTicket({ ...selectedTicket, status });
            setNewStatus(status);
            toast.success(`Status updated to ${status}`);
            fetchTickets(); // Refresh list
            fetchStats();   // Refresh stats
        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoomAction = async (action, roomId) => {
        let reason = "";
        if (action === 'reject') {
            reason = window.prompt("Enter rejection reason:", "Verification documents incomplete or invalid.");
            if (reason === null) return;
        }

        try {
            setIsSubmitting(true);
            const endpoint = `/admin/rooms/${roomId}/${action}`;
            const { data } = await api.put(endpoint, { reason });

            if (data.success) {
                toast.success(`Listing ${action}ed successfully`);
                const msg = action === 'approve'
                    ? "SYSTEM: Listing approved. Property is now live!"
                    : `SYSTEM: Listing rejected. Reason: ${reason}`;

                await supportApi.addReply(selectedTicket._id, { message: msg });
                await handleUpdateStatus('resolved'); // Auto-resolve ticket

                setTimeout(() => {
                    navigate(`/admin/rooms?tab=${action === 'approve' ? 'active' : 'pending'}`);
                }, 1500);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'high': return 'bg-red-50 text-red-600 border-red-100';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'low': return 'bg-green-50 text-green-600 border-green-100';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const getStatusBadge = (s) => {
        switch (s) {
            case 'open': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-amber-100 text-amber-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Help', val: stats?.open || 0, icon: AlertCircle, col: 'blue' },
                    { label: 'In Progress', val: stats?.in_progress || 0, icon: Clock, col: 'amber' },
                    { label: 'Resolved Today', val: stats?.resolved || 0, icon: CheckCircle, col: 'green' },
                    { label: 'Total Volume', val: stats?.total || 0, icon: Headphones, col: 'gray' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-${s.col}-50 text-${s.col}-600 flex items-center justify-center`}>
                            <s.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 leading-none">{s.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
                {/* Left: Queue */}
                <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search tickets, owners..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
                            {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilters({ ...filters, status: s })}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${filters.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                        }`}
                                >
                                    {s === '' ? 'All Queue' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="py-10 flex justify-center"><Loader size="small" /></div>
                        ) : tickets.length > 0 ? tickets.map(ticket => (
                            <motion.div
                                key={ticket._id}
                                onClick={() => selectTicket(ticket)}
                                whileHover={{ x: 3 }}
                                className={`p-5 rounded-[1.8rem] border transition-all cursor-pointer relative ${selectedTicket?._id === ticket._id ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusBadge(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                                <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                    {ticket.subject}
                                </h4>
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase truncate">
                                        <Users size={10} /> {ticket.owner?.name}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 ml-auto">
                                        <Clock size={10} /> {safeFormatDistance(ticket.createdAt)}
                                    </div>
                                </div>
                                {selectedTicket?._id === ticket._id && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-600 rounded-r-full" />}
                            </motion.div>
                        )) : (
                            <div className="py-20 text-center opacity-40">
                                <MessageSquare className="mx-auto mb-2" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Workspace Empty</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Workspace */}
                <div className="lg:col-span-7 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {showDetail && selectedTicket ? (
                            <motion.div
                                key={selectedTicket._id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                {/* Master Info Header */}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                                <Headphones size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">#{selectedTicket.ticketId}</h2>
                                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Support Conversation</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <select
                                                value={newStatus}
                                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                                className={`text-[9px] font-black uppercase tracking-widest border-none rounded-xl px-4 py-2 outline-none ring-2 ring-gray-100 focus:ring-blue-100 transition-all ${getStatusBadge(selectedTicket.status)}`}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                                        <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Mail size={12} className="text-blue-600" /> Subject: {selectedTicket.subject}
                                        </h5>
                                        <p className="text-sm text-gray-500 font-medium italic leading-relaxed leading-[1.8] pl-2">
                                            "{selectedTicket.description}"
                                        </p>
                                    </div>

                                    {/* Power Actions Panel */}
                                    {selectedTicket.room && (
                                        <div className="mt-8 p-6 bg-blue-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                                                <ShieldCheck size={120} />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                                        <Home size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-blue-200 leading-none">Power Actions</h4>
                                                        <p className="text-[10px] font-bold text-white/60 mt-1 uppercase tracking-tighter">Linked Property Control</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => handleRoomAction('approve', selectedTicket.room._id)}
                                                        disabled={isSubmitting}
                                                        className="flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 px-6 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/40 group"
                                                    >
                                                        <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">Approve Listing</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRoomAction('reject', selectedTicket.room._id)}
                                                        disabled={isSubmitting}
                                                        className="flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 px-6 py-4 rounded-2xl transition-all shadow-lg shadow-rose-900/40 group"
                                                    >
                                                        <ShieldX size={20} className="group-hover:scale-110 transition-transform" />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">Reject Listing</span>
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/admin/rooms?tab=pending`)}
                                                    className="w-full mt-4 flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-4 rounded-2xl transition-all group"
                                                >
                                                    <ExternalLink size={18} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">Open Room Inspector</span>
                                                </button>

                                                {/* Specialized Resolution Path */}
                                                <div className="mt-8 pt-6 border-t border-white/10">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-4">Urgent Resolution Path</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <a
                                                            href={`tel:${selectedTicket.owner?.phone}`}
                                                            className="flex flex-col items-center justify-center gap-1 bg-white/10 hover:bg-white/20 py-4 rounded-xl transition-all"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Phone size={14} />
                                                                <span className="text-[10px] font-bold">Call Owner</span>
                                                            </div>
                                                            <span className="text-[9px] text-white/40">{selectedTicket.owner?.phone || 'No Number'}</span>
                                                        </a>
                                                        <a
                                                            href={`mailto:${selectedTicket.owner?.email}`}
                                                            className="flex flex-col items-center justify-center gap-1 bg-white/10 hover:bg-white/20 py-4 rounded-xl transition-all"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Mail size={14} />
                                                                <span className="text-[10px] font-bold">Email Tech Log</span>
                                                            </div>
                                                            <span className="text-[9px] text-white/40 truncate w-full text-center px-2">{selectedTicket.owner?.email || 'No Email'}</span>
                                                        </a>
                                                    </div>
                                                    <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5">
                                                        <p className="text-[10px] text-white/40 italic leading-relaxed text-center">
                                                            "Tech Path: Verify listing data in Inspector, notify owner via Phone/Email for immediate confirmation, then Approve/Reject."
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Attachment Box if any */}
                                    {selectedTicket.attachments?.length > 0 && (
                                        <div className="mt-6 flex flex-wrap gap-3">
                                            {selectedTicket.attachments.map((at, i) => (
                                                <a key={i} href={at.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-blue-200">
                                                    <AlertTriangle size={12} /> View Screenshot
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Response Thread */}
                                <div className="space-y-4 px-2">
                                    <div className="text-center py-4 relative">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                        <span className="relative bg-[#FCFCFD] px-4 text-[9px] font-black text-gray-300 uppercase tracking-widest">Beginning of Log</span>
                                    </div>

                                    {selectedTicket.responses.map((resp, i) => (
                                        <div key={i} className={`flex ${resp.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-5 rounded-[1.8rem] shadow-sm ${resp.isAdmin ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'
                                                }`}>
                                                <div className="flex items-center justify-between gap-10 mb-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${resp.isAdmin ? 'text-blue-400' : 'text-gray-400'}`}>
                                                        {resp.isAdmin ? 'You (Admin)' : selectedTicket.owner?.name}
                                                    </span>
                                                    <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">
                                                        {safeFormatDistance(resp.createdAt)} ago
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-[1.6] font-medium">{resp.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Reply Form */}
                                {selectedTicket.status !== 'closed' && (
                                    <form onSubmit={handleSendReply} className="relative pt-4 px-2 pb-10">
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Compose a resolution message..."
                                            className="w-full bg-white border border-gray-100 rounded-[2.5rem] p-8 pr-28 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-xl min-h-[140px] resize-none"
                                        />
                                        <div className="absolute bottom-16 right-8 flex items-center gap-3">
                                            {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !replyMessage.trim()}
                                                className="p-5 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                                            >
                                                <Send size={24} />
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 p-10 text-center">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <ShieldCheck size={48} className="text-gray-100" />
                                </div>
                                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Ready for Duty</h2>
                                <p className="text-[11px] font-bold text-gray-300 max-w-xs leading-loose uppercase tracking-widest">
                                    Select a pending listing or payment issue from the quality queue to initiate resolution sequence.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminSupport;
