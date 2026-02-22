import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    History, User, Activity, Clock,
    Search, Shield, AlertCircle, CheckCircle,
    ArrowRight, ShieldAlert, Cpu, Home, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Loader from '../components/common/Loader';

const AdminAuditPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'user', 'room', 'report'
    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/audit-logs');
            setLogs(response.data.data || []);
        } catch (error) {
            console.error('Audit fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        if (action.includes('REJECT') || action.includes('SUSPEND') || action.includes('BLOCK') || action.includes('DELETE'))
            return <ShieldAlert className="text-red-500" size={18} />;
        if (action.includes('APPROVE') || action.includes('ACTIVATE') || action.includes('RESOLVE') || action.includes('VERIFY'))
            return <CheckCircle className="text-green-500" size={18} />;
        return <Activity className="text-blue-500" size={18} />;
    };

    const handleLogClick = (log) => {
        if (log.targetType === 'User') navigate(`/admin/users?id=${log.targetId}`);
        if (log.targetType === 'Room') navigate(`/rooms/${log.targetId}`);
        if (log.targetType === 'Report') navigate(`/admin/reports?id=${log.targetId}`);
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader size="large" /></div>;

    // ... existing useEffect ...

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.targetName?.toLowerCase().includes(search.toLowerCase()) ||
            log.admin?.name?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'all' ? true :
                filter === 'user' ? log.targetType === 'User' :
                    filter === 'room' ? log.targetType === 'Room' :
                        filter === 'report' ? log.targetType === 'Report' : true;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <History className="text-blue-600" /> Administrative Audit Trail
                    </h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Immutable Ledger of System Directives</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl">
                    {['all', 'user', 'room', 'report'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {f === 'all' ? 'All Logs' : f === 'user' ? 'User Actions' : f === 'room' ? 'Room Logic' : 'Safety'}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#FDFDFE] border-b border-gray-50">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Directive & Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Entity</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rationale</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Temporal Log</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLogs.map((log) => (
                                <tr
                                    key={log._id}
                                    className="hover:bg-gray-50 transition-colors group"
                                >
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 cursor-pointer" onClick={() => handleLogClick(log)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden">
                                                {log.targetImage ? (
                                                    <img src={log.targetImage} className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        {log.targetType === 'User' && <User size={14} />}
                                                        {log.targetType === 'Room' && <Home size={14} />}
                                                        {log.targetType === 'Report' && <FileText size={14} />}
                                                    </>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-blue-600 uppercase truncate max-w-[150px] hover:underline offset-2">{log.targetName || 'SYSTEM_NODE'}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{log.targetType} / {log.targetId.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden">
                                                {log.admin?.avatar?.url ? (
                                                    <img src={log.admin.avatar.url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-black text-blue-600">{log.admin?.name?.charAt(0) || 'S'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-gray-900 uppercase">{log.admin?.name || 'SYSTEM'}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">ID: {log.admin?._id.slice(-6) || 'CORE'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-[11px] font-bold text-gray-500 max-w-xs">{log.reason || 'Automated directive execution.'}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-300" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAuditPage;
