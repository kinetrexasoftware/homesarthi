import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

const VisitsPage = () => {
  const { user } = useAuthStore();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, completed

  useEffect(() => {
    fetchVisits();
  }, [user?.role]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      let endpoint = '';

      if (user?.role === 'student') {
        endpoint = '/visits/my-visits';
      } else if (user?.role === 'owner') {
        endpoint = '/visits/owner-visits';
      }

      if (endpoint) {
        const response = await api.get(endpoint);
        setVisits(response.data.data?.visits || []);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (visitId) => {
    try {
      setActionLoading(visitId);
      await api.put(`/visits/${visitId}/approve`, {
        responseMessage: responseMessage.trim() || 'Your visit request has been approved!'
      });

      toast.success('Visit request approved');
      setVisits(prev => prev.map(visit =>
        visit._id === visitId
          ? {
            ...visit,
            status: 'approved',
            ownerResponse: responseMessage.trim() || 'Your visit request has been approved!',
            respondedAt: new Date()
          }
          : visit
      ));
      setShowModal(false);
      setResponseMessage('');
      setSelectedVisit(null);
    } catch (error) {
      console.error('Error approving visit:', error);
      toast.error(error.response?.data?.message || 'Failed to approve visit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!responseMessage.trim()) {
      toast.error('Please provide a response message');
      return;
    }

    try {
      setActionLoading(selectedVisit._id);
      await api.put(`/visits/${selectedVisit._id}/reject`, {
        responseMessage: responseMessage.trim()
      });

      toast.success('Visit request rejected');
      setVisits(prev => prev.map(visit =>
        visit._id === selectedVisit._id
          ? { ...visit, status: 'rejected', ownerResponse: responseMessage.trim(), respondedAt: new Date() }
          : visit
      ));
      setShowModal(false);
      setResponseMessage('');
      setSelectedVisit(null);
    } catch (error) {
      console.error('Error rejecting visit:', error);
      toast.error(error.response?.data?.message || 'Failed to reject visit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (visitId) => {
    try {
      setActionLoading(visitId);
      await api.put(`/visits/${visitId}/complete`);

      toast.success('Visit marked as completed');
      setVisits(prev => prev.map(visit =>
        visit._id === visitId ? { ...visit, status: 'completed' } : visit
      ));
    } catch (error) {
      console.error('Error completing visit:', error);
      toast.error(error.response?.data?.message || 'Failed to complete visit');
    } finally {
      setActionLoading(null);
    }
  };

  const openResponseModal = (visit) => {
    setSelectedVisit(visit);
    setShowModal(true);
  };

  const closeResponseModal = () => {
    setShowModal(false);
    setResponseMessage('');
    setSelectedVisit(null);
  };

  const filteredVisits = visits.filter(visit => {
    if (filter === 'all') return true;
    return visit.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'student' ? 'My Visit Requests' : 'Visit Requests'}
        </h1>
        <p className="mt-2 text-gray-600">
          {user?.role === 'student'
            ? 'Track your room visit requests and their status'
            : 'Manage visit requests for your rooms'
          }
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide flex-shrink-0">
        <nav className="flex space-x-6 min-w-max border-b border-gray-100">
          {[
            { key: 'all', label: 'All', count: visits.length },
            { key: 'pending', label: 'Pending', count: visits.filter(v => v.status === 'pending').length },
            { key: 'approved', label: 'Approved', count: visits.filter(v => v.status === 'approved').length },
            { key: 'completed', label: 'Completed', count: visits.filter(v => v.status === 'completed').length },
            { key: 'rejected', label: 'Rejected', count: visits.filter(v => v.status === 'rejected').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`py-3 px-1 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap -mb-[2px] ${filter === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                }`}
            >
              {label} <span className="ml-1 opacity-60">({count})</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <EmptyState
          title={`No ${filter === 'all' ? '' : filter} visits`}
          description={
            filter === 'all'
              ? user?.role === 'student'
                ? "You haven't requested any visits yet"
                : "No visit requests for your rooms"
              : `No visits with ${filter} status`
          }
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* MOBILE LIST (Cards) */}
          <div className="md:hidden space-y-4">
            {filteredVisits.map((visit) => (
              <div key={visit._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-50">
                      {user?.role === 'student' ? (
                        visit.room?.images?.[0]?.url ? (
                          <img src={visit.room.images[0].url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-gray-400">Room</div>
                        )
                      ) : (
                        visit.student?.avatar?.url ? (
                          <img src={visit.student.avatar.url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-blue-600 bg-blue-50">
                            {visit.student?.name?.[0]?.toUpperCase()}
                          </div>
                        )
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate uppercase">
                        {user?.role === 'student' ? visit.room?.title : visit.student?.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">
                        {user?.role === 'student' ? visit.owner?.name : visit.student?.email}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border shrink-0 ${getStatusColor(visit.status).replace('text-', 'bg-').replace('text-', 'border-').replace('text-', 'text-')}`}>
                    {visit.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Visit Date</p>
                    <p className="text-xs font-black text-gray-900">{formatDate(visit.requestedDate).split(',')[0]}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Time Slot</p>
                    <p className="text-xs font-black text-gray-900 uppercase">{visit.requestedTime}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    Requested: {formatDate(visit.createdAt)}
                  </p>
                  {visit.notes && <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">"{visit.notes}"</p>}
                  {visit.ownerResponse && (
                    <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Owner Message</p>
                      <p className="text-xs font-bold text-green-900 leading-relaxed">{visit.ownerResponse}</p>
                    </div>
                  )}
                </div>

                {/* Additional Info (Contacts/Address for approved) */}
                {user?.role === 'student' && visit.status === 'approved' && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                    {visit.room?.contactNumber && (
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Contact Owner</p>
                        <p className="text-sm font-black text-blue-900">{visit.room.contactNumber}</p>
                      </div>
                    )}
                    {visit.room?.location?.address && (
                      <div className="mb-3">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Property Address</p>
                        <p className="text-xs font-bold text-blue-900 leading-relaxed truncate">
                          {visit.room.location.address.street}, {visit.room.location.address.city}
                        </p>
                      </div>
                    )}
                    {/* Get Directions Button for Students */}
                    {(() => {
                      const exactCoords = visit.room?.location?.exactLocation?.coordinates;
                      const approxCoords = visit.room?.location?.coordinates;
                      const coords = (exactCoords && exactCoords.length === 2) ? exactCoords : approxCoords;

                      if (coords && coords.length === 2) {
                        const [lng, lat] = coords;
                        return (
                          <div className="pt-2">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-600/20"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                              Get Directions
                            </a>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {user?.role === 'owner' && visit.identityProof && (
                  <div className="pt-2">
                    <a
                      href={visit.identityProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                      View Student ID Card
                    </a>
                  </div>
                )}

                {user?.role === 'owner' && visit.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleApprove(visit._id)} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/20">Approve</button>
                    <button onClick={() => openResponseModal(visit)} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">Reject</button>
                  </div>
                )}
                {user?.role === 'owner' && visit.status === 'approved' && (
                  <button onClick={() => handleComplete(visit._id)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">Mark Completed</button>
                )}
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white shadow-sm rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              {/* Existing table content ... */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {user?.role === 'student' ? 'Room Details' : 'Student Details'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    {user?.role === 'owner' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVisits.map((visit) => (
                    <tr key={visit._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {user?.role === 'student' ? (
                              visit.room?.images?.[0]?.url ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  src={visit.room.images[0].url}
                                  alt={visit.room.title}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">Room</span>
                                </div>
                              )
                            ) : (
                              visit.student?.avatar?.url ? (
                                <img
                                  className="h-12 w-12 rounded-full object-cover"
                                  src={visit.student.avatar.url}
                                  alt={visit.student.name}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {visit.student?.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                          <div className="ml-4">
                            {user?.role === 'student' ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">{visit.room?.title}</div>
                                <div className="text-sm text-gray-500">{visit.owner?.name}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-gray-900">{visit.student?.name}</div>
                                <div className="text-sm text-gray-500">{visit.student?.email}</div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(visit.requestedDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {visit.requestedTime}
                        </div>
                        {visit.notes && (
                          <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                            {visit.notes}
                          </div>
                        )}
                        {user?.role === 'owner' && visit.identityProof && (
                          <a
                            href={visit.identityProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                            View ID Proof
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                          {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                        </span>
                        {visit.ownerResponse && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs">
                            {visit.ownerResponse}
                          </div>
                        )}

                        {/* Contact Number - Visible for approved visits */}
                        {user?.role === 'student' && visit.status === 'approved' && visit.room?.contactNumber && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs font-bold text-green-800 uppercase mb-1">📞 Contact</div>
                            <div className="text-sm font-bold text-green-900">{visit.room.contactNumber}</div>
                            <div className="text-xs text-green-600 mt-1">✓ Available after approval</div>
                          </div>
                        )}


                        {/* Exact Location - Visible for approved visits or if owner shared exact location publicly */}
                        {user?.role === 'student' &&
                          (visit.room?.location?.exactLocation || visit.room?.location?.address) &&
                          (visit.room?.location?.locationVisibility === 'exact' || visit.status === 'approved') && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                              <div className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                Exact Property Location
                              </div>

                              {/* Full Address */}
                              {visit.room?.location?.address && (
                                <div className="mb-2 pb-2 border-b border-blue-200 border-dashed">
                                  <div className="text-xs font-medium text-blue-900 leading-relaxed">
                                    {visit.room.location.address.street ? `${visit.room.location.address.street}, ` : ''}
                                    {visit.room.location.address.city}, {visit.room.location.address.state}
                                    {visit.room.location.address.zipCode ? ` - ${visit.room.location.address.zipCode}` : ''}
                                  </div>
                                </div>
                              )}

                              {/* Coordinates & Map Link */}
                              {(() => {
                                const exactCoords = visit.room?.location?.exactLocation?.coordinates;
                                const approxCoords = visit.room?.location?.coordinates;

                                // Use exact coords if available and valid length, otherwise fallback to approx coords
                                const coords = (exactCoords && exactCoords.length === 2) ? exactCoords : approxCoords;

                                if (coords && coords.length === 2) {
                                  const [lng, lat] = coords;
                                  return (
                                    <>
                                      <div className="text-xs font-mono text-blue-900 mb-2 bg-blue-100/50 p-1 rounded inline-block">
                                        {lat?.toFixed(6)}°, {lng?.toFixed(6)}°
                                      </div>
                                      <div className="mt-1">
                                        <a
                                          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm gap-1.5"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                                          Get Directions
                                        </a>
                                      </div>
                                    </>
                                  );
                                }
                                return null;
                              })()}

                              <div className="text-[10px] text-blue-600 mt-2 flex items-center gap-1 font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                {visit.status === 'approved'
                                  ? 'Address shared (Visit Approved)'
                                  : 'Publicly shared by owner'}
                              </div>
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(visit.createdAt)}
                      </td>
                      {user?.role === 'owner' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {visit.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(visit._id)}
                                  disabled={actionLoading === visit._id}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                  {actionLoading === visit._id ? (
                                    <Loader size="small" />
                                  ) : (
                                    'Approve'
                                  )}
                                </button>
                                <button
                                  onClick={() => openResponseModal(visit)}
                                  disabled={actionLoading === visit._id}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {visit.status === 'approved' && (
                              <button
                                onClick={() => handleComplete(visit._id)}
                                disabled={actionLoading === visit._id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                              >
                                {actionLoading === visit._id ? (
                                  <Loader size="small" />
                                ) : (
                                  'Complete'
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeResponseModal}
        title={selectedVisit?.status === 'pending' ? 'Respond to Visit Request' : 'Reject Visit Request'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Message *
            </label>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={selectedVisit?.status === 'pending'
                ? "Enter your response message for approval..."
                : "Enter your rejection reason..."
              }
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeResponseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={selectedVisit?.status === 'pending' ? () => handleApprove(selectedVisit._id) : handleReject}
              disabled={actionLoading === selectedVisit?._id || !responseMessage.trim()}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${selectedVisit?.status === 'pending' ? 'bg-green-600' : 'bg-red-600'
                }`}
            >
              {actionLoading === selectedVisit?._id ? (
                <div className="flex items-center">
                  <Loader size="small" />
                  <span className="ml-2">
                    {selectedVisit?.status === 'pending' ? 'Approving...' : 'Rejecting...'}
                  </span>
                </div>
              ) : (
                selectedVisit?.status === 'pending' ? 'Approve Request' : 'Reject Request'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VisitsPage;
