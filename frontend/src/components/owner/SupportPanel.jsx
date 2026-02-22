import { useState, useEffect } from 'react';
import {
    Plus, MessageSquare, Clock, CheckCircle,
    AlertCircle, ChevronRight, Send, Paperclip,
    Search, Filter, X, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import supportApi from '../../utils/supportApi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const SupportPanel = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list, detail, create
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [myRooms, setMyRooms] = useState([]);

    // Create Form State
    const [formData, setFormData] = useState({
        category: 'listing_issue',
        subject: '',
        description: '',
        roomId: '',
        priority: 'medium'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');

    useEffect(() => {
        fetchTickets();
        fetchRooms();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data } = await supportApi.getMyTickets();
            setTickets(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/rooms/my-rooms');
            setMyRooms(data.data.rooms || []);
        } catch (error) { }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.description) {
            return toast.error('Subject and description are required');
        }

        try {
            setIsSubmitting(true);
            await supportApi.createTicket(formData);
            toast.success('Support ticket created');
            setView('list');
            setFormData({ category: 'listing_issue', subject: '', description: '', roomId: '', priority: 'medium' });
            fetchTickets();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            setIsSubmitting(true);
            const { data } = await supportApi.addReply(selectedTicket._id, { message: replyMessage });

            // Refresh ticket details
            const updatedTicket = { ...selectedTicket };
            updatedTicket.responses.push({
                ...data.data,
                user: { name: 'You' } // Simplified for UI update
            });
            setSelectedTicket(updatedTicket);
            setReplyMessage('');
            toast.success('Reply sent');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const viewTicket = async (ticket) => {
        try {
            setLoading(true);
            const { data } = await supportApi.getTicketById(ticket._id);
            setSelectedTicket(data.data);
            setView('detail');
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-amber-100 text-amber-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading && view !== 'detail') return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Support Center</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Contact Admin & Resolution Desk</p>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => setView('create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={16} /> New Ticket
                    </button>
                )}
                {view !== 'list' && (
                    <button
                        onClick={() => setView('list')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                        <X size={16} /> Back to List
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === 'list' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid gap-4"
                    >
                        {tickets.length > 0 ? tickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                onClick={() => viewTicket(ticket)}
                                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-2xl ${getStatusColor(ticket.status)} bg-opacity-10`}>
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">#{ticket.ticketId}</span>
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{ticket.subject}</h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>

                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <Clock size={12} />
                                                    {formatDistanceToNow(new Date(ticket.createdAt))} ago
                                                </div>
                                                {ticket.room && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                                        <Home size={12} />
                                                        {ticket.room.title}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">No Active Tickets</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight">Raise a ticket if you need help with listings or verification.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'create' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl"
                    >
                        <form onSubmit={handleCreateTicket} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                    >
                                        <option value="listing_issue">Listing Issue</option>
                                        <option value="payment">Payment/Billing</option>
                                        <option value="verification">verification Help</option>
                                        <option value="technical">Technical Glitch</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Property (Optional)</label>
                                    <select
                                        value={formData.roomId}
                                        onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                    >
                                        <option value="">No Listing Linked</option>
                                        {myRooms.map(room => (
                                            <option key={room._id} value={room._id}>{room.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Summarize your issue..."
                                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Explain your problem in detail. Mention what happened and what you need help with."
                                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Submit Ticket'}
                            </button>
                        </form>
                    </motion.div>
                )}

                {view === 'detail' && selectedTicket && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid lg:grid-cols-12 gap-8"
                    >
                        {/* Thread side */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${getStatusColor(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400"># {selectedTicket.ticketId}</span>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{selectedTicket.subject}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed italic border-l-4 border-blue-600 pl-4 bg-gray-50 py-4 rounded-r-xl">
                                    {selectedTicket.description}
                                </p>
                            </div>

                            {/* Responses list */}
                            <div className="space-y-4">
                                {selectedTicket.responses.map((resp, i) => (
                                    <div key={i} className={`flex ${resp.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] rounded-[1.8rem] p-5 shadow-sm ${resp.isAdmin ? 'bg-white border border-gray-100 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                                            <div className="flex items-center justify-between gap-10 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                    {resp.isAdmin ? 'Admin Support' : 'You'}
                                                </span>
                                                <span className="text-[9px] font-bold opacity-40 uppercase">
                                                    {formatDistanceToNow(new Date(resp.createdAt))} ago
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{resp.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply box */}
                            {selectedTicket.status !== 'closed' && (
                                <form onSubmit={handleSendReply} className="relative mt-10">
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="w-full bg-white border border-gray-100 rounded-[2.5rem] p-6 pr-20 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-xl min-h-[120px] resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !replyMessage.trim()}
                                        className="absolute bottom-6 right-6 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:bg-gray-200"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Sidebar info */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Conversation Details</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${selectedTicket.priority === 'high' ? 'bg-red-50 text-red-600' :
                                            selectedTicket.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                                'bg-green-50 text-green-600'
                                            }`}>{selectedTicket.priority}</span>
                                    </div>
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
                                        <span className="text-[10px] font-black text-gray-900 uppercase">{selectedTicket.category.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created</span>
                                        <span className="text-[10px] font-black text-gray-900 uppercase">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedTicket.room && (
                                <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">Linked Property</p>
                                        <h5 className="text-sm font-black uppercase tracking-tight mb-4">{selectedTicket.room.title}</h5>
                                        <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10">
                                            View Listing
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupportPanel;
