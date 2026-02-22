import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Home, AlertTriangle, ShieldCheck,
  MapPin, Activity, Clock, ArrowRight,
  TrendingUp, ShieldAlert, Zap, Globe, FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import AdminStatCard from '../components/admin/AdminStatCard';
import { SeverityDonut, ActivityLine, RiskHotspots } from '../components/admin/DashboardCharts';
import Loader from '../components/common/Loader';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [geoRisk, setGeoRisk] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes, geoRes, auditRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics/reports'),
        api.get('/admin/analytics/geo-risk'),
        api.get('/admin/audit-logs')
      ]);

      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setGeoRisk(geoRes.data.data);
      setAuditLogs(auditRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await api.get('/admin/rooms/export-reports', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Room_Reports_Detailed.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download report');
    }
  };

  const handleDownloadStudents = async () => {
    try {
      const response = await api.get('/admin/users/export-students', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Reports.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download student report');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size="large" />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time system monitoring</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadStudents}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Users size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Student Report</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            <FileDown size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Room Report</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <AdminStatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          color="blue"
          trend={12}
          onClick={() => navigate('/admin/users')}
        />
        <AdminStatCard
          title="Active Listings"
          value={stats?.totalRooms}
          icon={Home}
          color="green"
          trend={5}
          onClick={() => navigate('/admin/rooms?tab=active')}
        />
        <AdminStatCard
          title="Room Approvals"
          value={stats?.pendingRooms}
          icon={ShieldAlert}
          color="red"
          onClick={() => navigate('/admin/rooms?tab=pending')}
        />
        <AdminStatCard
          title="Owner Verifications"
          value={stats?.pendingOwners}
          icon={ShieldCheck}
          color="yellow"
          onClick={() => navigate('/admin/users?role=owner&status=unverified')}
        />
        <AdminStatCard
          title="Active Reports"
          value={stats?.totalReports}
          icon={AlertTriangle}
          color="red"
          onClick={() => navigate('/admin/reports')}
        />
        <AdminStatCard
          title="System Health"
          value="99.9%"
          icon={Zap}
          color="green"
        />
      </div>


      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Trend */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Report Activity Trend</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Global incoming flags (Last 30 Days)</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-600 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp size={14} /> Normal Volume
            </div>
          </div>
          <ActivityLine data={analytics?.trend} />
        </div>

        {/* Severity Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-2">Severity Heat</h3>
          <p className="text-[10px] font-bold text-gray-400 mb-8 uppercase tracking-widest">By Report Category</p>
          <SeverityDonut data={analytics?.severity} />
        </div>
      </div>

      {/* Bottom Grid: Audit & Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Audit Trail */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Activity size={18} className="text-blue-600" /> Admin Audit Trail
            </h3>
            <button onClick={() => window.location.href = '/admin/audit'} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All Logs</button>
          </div>

          <div className="space-y-6">
            {auditLogs.slice(0, 5).map((log) => {
              const getNavigatePath = () => {
                if (log.targetType === 'User') return `/admin/users?id=${log.targetId}`;
                if (log.targetType === 'Room') return `/admin/rooms?id=${log.targetId}`;
                if (log.targetType === 'Report') return `/admin/reports?id=${log.targetId}`;
                return '#';
              };

              return (
                <div
                  key={log._id}
                  onClick={() => log.targetType !== 'Report' && navigate(getNavigatePath())}
                  className={`flex items-start gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors group ${log.targetType !== 'Report' ? 'cursor-pointer' : ''}`}
                >
                  <div className={`mt-1 p-2 rounded-xl ${log.action.includes('REJECT') || log.action.includes('SUSPEND') || log.action.includes('BLOCK')
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
                    }`}>
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">
                        {log.admin?.name || 'System'} <span className="text-gray-400 font-bold ml-1">{log.action.replace(/_/g, ' ')}</span>
                      </p>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-[10px] text-gray-500 font-medium truncate italic flex-shrink-0">"{log.reason || 'No reason'}"</p>
                      {log.targetName && (
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest break-all">→ {log.targetName}</span>
                      )}
                    </div>
                  </div>
                  {log.targetType !== 'Report' && <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic Risk Heatmap */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Globe size={18} className="text-red-600" /> Regional Risk Hotspots
            </h3>
            <div className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
              High Variance
            </div>
          </div>

          <RiskHotspots data={geoRisk} />

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Risk Zone</span>
              <span className="text-xs font-black text-red-600 uppercase">{geoRisk[0]?._id || 'N/A'}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Risk Score</span>
              <span className="text-xs font-black text-blue-600">{(geoRisk.reduce((acc, curr) => acc + curr.avgScore, 0) / (geoRisk.length || 1)).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
