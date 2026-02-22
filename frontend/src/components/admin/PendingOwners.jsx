import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';

const PendingOwners = () => {
  const [pendingOwners, setPendingOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all'); // all, recent, old

  useEffect(() => {
    fetchPendingOwners();
  }, []);

  const fetchPendingOwners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pending-owners');
      setPendingOwners(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending owners:', error);
      toast.error('Failed to load pending owners');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ownerId) => {
    try {
      setActionLoading(ownerId);
      await api.put(`/admin/owners/${ownerId}/verify`, { action: 'approve' });

      toast.success('Owner verified successfully');
      setPendingOwners(prev => prev.filter(owner => owner._id !== ownerId));
    } catch (error) {
      console.error('Error approving owner:', error);
      toast.error(error.response?.data?.message || 'Failed to approve owner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(selectedOwner._id);
      await api.put(`/admin/owners/${selectedOwner._id}/verify`, {
        action: 'reject',
        reason: rejectionReason
      });

      toast.success('Owner rejected successfully');
      setPendingOwners(prev => prev.filter(owner => owner._id !== selectedOwner._id));
      setShowModal(false);
      setRejectionReason('');
      setSelectedOwner(null);
    } catch (error) {
      console.error('Error rejecting owner:', error);
      toast.error(error.response?.data?.message || 'Failed to reject owner');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (owner) => {
    setSelectedOwner(owner);
    setShowModal(true);
  };

  const closeRejectModal = () => {
    setShowModal(false);
    setRejectionReason('');
    setSelectedOwner(null);
  };

  const filteredOwners = pendingOwners.filter(owner => {
    const daysSinceCreation = Math.floor(
      (new Date() - new Date(owner.createdAt)) / (1000 * 60 * 60 * 24)
    );

    switch (filter) {
      case 'recent':
        return daysSinceCreation <= 7;
      case 'old':
        return daysSinceCreation > 30;
      default:
        return true;
    }
  });

  const getVerificationDocuments = (owner) => {
    return owner.verificationDocuments || [];
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
          <h2 className="text-2xl font-bold text-gray-900">Pending Owner Verifications</h2>
          <p className="text-gray-600 mt-1">
            Review and verify property owners before they can list rooms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Pending</option>
            <option value="recent">Recent (≤7 days)</option>
            <option value="old">Old (30 days)</option>
          </select>
          <button
            onClick={fetchPendingOwners}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingOwners.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingOwners.filter(owner =>
                  Math.floor((new Date() - new Date(owner.createdAt)) / (1000 * 60 * 60 * 24)) <= 7
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Old Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingOwners.filter(owner =>
                  Math.floor((new Date() - new Date(owner.createdAt)) / (1000 * 60 * 60 * 24)) > 30
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Owners List */}
      {filteredOwners.length === 0 ? (
        <EmptyState
          title="No pending owners"
          description={filter === 'all' ? "All owner applications have been processed" : `No ${filter} applications found`}
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                    Owner Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOwners.map((owner) => (
                  <tr key={owner._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {owner.avatar?.url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={owner.avatar.url}
                              alt={owner.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {owner.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                          <div className="text-sm text-gray-500">{owner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{owner.phone}</div>
                      {owner.college && (
                        <div className="text-sm text-gray-500">{owner.college}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getVerificationDocuments(owner).map((doc, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {doc.type.replace('_', ' ')}
                          </span>
                        ))}
                        {getVerificationDocuments(owner).length === 0 && (
                          <span className="text-sm text-gray-500">No documents</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(owner.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(owner._id)}
                          disabled={actionLoading === owner._id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading === owner._id ? (
                            <Loader size="small" />
                          ) : (
                            'Approve'
                          )}
                        </button>
                        <button
                          onClick={() => openRejectModal(owner)}
                          disabled={actionLoading === owner._id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeRejectModal}
        title="Reject Owner Application"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Please provide a detailed reason for rejection..."
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeRejectModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading === selectedOwner?._id || !rejectionReason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === selectedOwner?._id ? (
                <div className="flex items-center">
                  <Loader size="small" />
                  <span className="ml-2">Rejecting...</span>
                </div>
              ) : (
                'Reject Application'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingOwners;
