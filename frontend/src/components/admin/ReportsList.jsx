import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // resolve
  const [actionNotes, setActionNotes] = useState('');
  const [actionChoice, setActionChoice] = useState(''); // none, block_user, remove_listing

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports');
      setReports(response.data.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async () => {
    if (!actionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }

    try {
      setActionLoading(selectedReport._id);
      const payload = {
        action: actionChoice,
        notes: actionNotes
      };

      await api.put(`/admin/reports/${selectedReport._id}/resolve`, payload);

      toast.success('Report resolved successfully');
      setShowModal(false);
      setActionNotes('');
      setActionChoice('');
      setSelectedReport(null);
      setActionType('');

      // Refresh reports
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error(error.response?.data?.message || 'Failed to resolve report');
    } finally {
      setActionLoading(null);
    }
  };

  const openResolveModal = (report) => {
    setSelectedReport(report);
    setActionType('resolve');
    setShowModal(true);
  };

  const closeResolveModal = () => {
    setShowModal(false);
    setActionNotes('');
    setActionChoice('');
    setSelectedReport(null);
    setActionType('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getReportTypeBadge = (type) => {
    const typeConfig = {
      spam: { color: 'bg-red-100 text-red-800', label: 'Spam' },
      inappropriate: { color: 'bg-orange-100 text-orange-800', label: 'Inappropriate' },
      fraud: { color: 'bg-purple-100 text-purple-800', label: 'Fraud' },
      harassment: { color: 'bg-pink-100 text-pink-800', label: 'Harassment' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Other' }
    };

    const config = typeConfig[type] || typeConfig.other;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports Management</h2>
          <p className="text-gray-600 mt-1">
            Review and resolve user reports and complaints
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <EmptyState
          title="No reports found"
          description="All reports have been resolved or there are no pending reports"
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {report.title || 'Report'}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {report.description}
                        </div>
                        {report.targetType && report.targetId && (
                          <div className="text-xs text-gray-400 mt-1">
                            Target: {report.targetType} ({report.targetId})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getReportTypeBadge(report.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.reportedBy?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.reportedBy?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => openResolveModal(report)}
                          disabled={actionLoading === report._id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      )}
                      {report.status === 'resolved' && report.resolvedAt && (
                        <div className="text-xs text-gray-500">
                          Resolved: {formatDate(report.resolvedAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Report Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeResolveModal}
        title="Resolve Report"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Resolve the report for: <strong>{selectedReport?.title || 'Report'}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Taken
            </label>
            <select
              value={actionChoice}
              onChange={(e) => setActionChoice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">No action taken</option>
              <option value="block_user">Block User</option>
              <option value="remove_listing">Remove Listing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Notes *
            </label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe the resolution steps taken..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={closeResolveModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveReport}
              disabled={actionLoading === selectedReport?._id || !actionNotes.trim()}
              className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            >
              {actionLoading === selectedReport?._id ? (
                <div className="flex items-center">
                  <Loader size="small" />
                  <span className="ml-2">Resolving...</span>
                </div>
              ) : (
                'Resolve Report'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsList;
