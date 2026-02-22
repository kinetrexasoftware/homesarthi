import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle, ShieldAlert, Gavel,
  Trash2, CheckCircle, Info, ExternalLink,
  MessageSquare, User as UserIcon, MoreHorizontal,
  ChevronRight, ArrowRight, ShieldCheck, Scale,
  Home, XCircle, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Loader from '../common/Loader';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [filter, setFilter] = useState('pending');
  const location = useLocation();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reportStatus = searchParams.get('status');
    if (reportStatus && filter !== reportStatus) {
      setFilter(reportStatus);
    }
  }, [location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reportId = searchParams.get('id');

    if (reportId && reports.length > 0) {
      const reportToSelect = reports.find(r => r._id === reportId);
      if (reportToSelect) {
        setSelectedReport(reportToSelect);
      }
    }
  }, [location.search, reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/reports?status=${filter}`);
      setReports(response.data.data.reports || []);
    } catch (error) {
      toast.error('Mediation data fetch failed.');
    } finally {
      setLoading(false);
    }
  };

  const executeResolution = async (action) => {
    if (!actionNotes.trim()) {
      toast.error('Review notes are required.');
      return;
    }

    try {
      await api.put(`/admin/reports/${selectedReport._id}/resolve`, {
        action,
        notes: actionNotes
      });

      const actionMsg = action === 'block_listing' ? 'Room Removed' :
        action === 'block_user' ? 'User Banned' : 'Report Dismissed';

      toast.success(actionMsg);
      setSelectedReport(null);
      setActionNotes('');
      fetchReports();
    } catch (error) {
      toast.error('Moderation action failed.');
    }
  };

  const getSeverityColor = (reason) => {
    const critical = ['scam_fraud', 'privacy_violation', 'unsafe_area'];
    return critical.includes(reason) ? 'text-red-500 bg-red-50' : 'text-orange-500 bg-orange-50';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-130px)]">
      {/* Left Pane: Incident Registry */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-[#FDFDFE]">
          <div className="space-y-4 mb-4">
            <div className="min-w-0">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none">Safety Registry</h3>
              <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest truncate">Incident Monitoring Queue</p>
            </div>

            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 w-full overflow-hidden">
              {['pending', 'resolved', 'dismissed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-2 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Quick search incidents..."
              className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all border-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {reports.length > 0 ? reports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedReport(report)}
                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative ${selectedReport?._id === report._id
                  ? 'border-blue-200 bg-blue-50/30'
                  : 'border-gray-50 hover:border-gray-100 hover:bg-gray-50/50'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getSeverityColor(report.reason)}`}>
                    {report.reason.replace(/_/g, ' ')}
                  </div>
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    {report.reportType === 'room' ? <Home size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">
                      {report.target?.title || report.target?.name || `Target: ${report.reportType.toUpperCase()}`}
                    </h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      ID: #{report.target?.customId || report.targetId.slice(-6)}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-gray-500 line-clamp-2 italic leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                  "{report.description}"
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center">
                      <img src={`https://ui-avatars.com/api/?name=${report.reportedBy?.name}`} className="w-full h-full" alt="" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight truncate w-32">
                      Report by {report.reportedBy?.name}
                    </span>
                  </div>
                  {report.weight > 1.2 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <ShieldCheck size={12} />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Verified</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
                <CheckCircle size={40} className="text-gray-200 mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Queue Clear</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Pane: Mediation Console */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {selectedReport ? (
            <motion.div
              key={selectedReport._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 space-y-6 overflow-y-auto pr-2"
            >
              {/* Evidence Detail Block */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Resolution Console</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Incident Token: {selectedReport._id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Risk Weight</p>
                    <p className="text-2xl font-black text-blue-600">{selectedReport.weight.toFixed(1)}x</p>
                  </div>
                </div>

                {/* Target Preview */}
                <div className="p-8 bg-gray-900 rounded-[2rem] text-white mb-10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10">
                      {selectedReport.target?.images?.[0]?.url ? (
                        <img src={selectedReport.target.images[0].url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Eye size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-widest">Reporting Target</p>
                      <h4 className="text-lg font-black tracking-tight uppercase leading-tight">
                        {selectedReport.target?.title || selectedReport.target?.name || 'Unknown Entity'}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">ID: {selectedReport.target?.customId || selectedReport.targetId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(selectedReport.reportType === 'room' ? `/rooms/${selectedReport.targetId}` : `/profile/${selectedReport.targetId}`, '_blank')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Inspect
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="p-6 bg-gray-50 rounded-3xl space-y-1">
                    <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Source Reporter</label>
                    <p className="text-sm font-black uppercase tracking-tight text-gray-900 truncate">{selectedReport.reportedBy?.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 truncate tracking-tight">{selectedReport.reportedBy?.email}</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl space-y-1">
                    <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Category</label>
                    <p className="text-sm font-black uppercase tracking-tight text-red-600">{selectedReport.reason.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Internal Risk Mapping: HIGH</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-600" /> Evidence Narrative
                  </h4>
                  <div className="p-8 bg-blue-50/30 rounded-3xl border border-blue-50 italic text-sm font-bold text-gray-700 leading-relaxed border-dashed">
                    "{selectedReport.description}"
                  </div>
                </div>

                {/* Directive Selection */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Gavel size={16} className="text-red-600" /> Moderaion Directives
                  </h4>

                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Provide a justification for this moderator decision..."
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-6 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-all resize-none"
                    rows={4}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => executeResolution('block_listing')}
                      disabled={filter !== 'pending'}
                      className={`flex flex-col items-center justify-center gap-2 py-6 bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 group ${filter !== 'pending' && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                      <span>Remove Room</span>
                    </button>
                    <button
                      onClick={() => executeResolution('block_user')}
                      disabled={filter !== 'pending'}
                      className={`flex flex-col items-center justify-center gap-2 py-6 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all group ${filter !== 'pending' && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <ShieldAlert size={18} className="group-hover:scale-110 transition-transform" />
                      <span>Ban User</span>
                    </button>
                    <button
                      onClick={() => executeResolution('dismiss')}
                      disabled={filter !== 'pending'}
                      className={`flex flex-col items-center justify-center gap-2 py-6 bg-green-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 group ${filter !== 'pending' && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <XCircle size={18} className="group-hover:scale-110 transition-transform" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-gray-200 mb-6">
                <Scale size={40} />
              </div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Moderation Standby</h3>
              <p className="text-[11px] font-bold text-gray-300 max-w-xs uppercase tracking-tight leading-relaxed">
                Assess incident reports and enforce community safety directives with precision
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportsManagement;
