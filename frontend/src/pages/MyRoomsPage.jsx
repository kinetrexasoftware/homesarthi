import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const MyRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const filteredRooms = rooms.filter(room => {
    if (filter === 'all') return true;
    return room.verification?.status === filter;
  });

  const fetchMyRooms = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const { data } = await api.get('/rooms/my-rooms');
      setRooms(data.data.rooms);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRooms();

    // Refetch when window gets focus (user switches back to tab)
    const handleFocus = () => fetchMyRooms(false);
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchMyRooms]);

  const handleRefresh = () => {
    fetchMyRooms(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await api.delete(`/rooms/${id}`);
      setRooms(rooms.filter(room => room._id !== id));
      toast.success('Room deleted successfully');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-warning',
      approved: 'badge badge-success',
      rejected: 'badge badge-danger'
    };
    return badges[status] || 'badge';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">My Listings</h1>
          <p className="text-gray-600">Manage your property listings</p>
        </div>
        <Link to="/owner/rooms/new" className="btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Add New Room</span>
        </Link>
      </div>

      <div className="flex overflow-x-auto space-x-2 pb-4 mb-4 no-scrollbar">
        {['all', 'approved', 'pending', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-6 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all duration-200 ${filter === status
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState
          icon="🏠"
          title={filter === 'all' ? "No listings yet" : `No ${filter} listings`}
          description={filter === 'all' ? "Start by creating your first room listing" : `You don't have any listings with ${filter} status`}
          action={
            filter === 'all' && (
              <Link to="/owner/rooms/new" className="btn-primary">
                Create First Listing
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-6">
          {filteredRooms.map(room => (
            <div key={room._id} className="card p-6 group hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative">
                  <img
                    src={room.images[0]?.url}
                    alt={room.title}
                    className="w-full md:w-48 h-32 object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${room.verification?.status === 'approved' ? 'bg-green-100 text-green-700' :
                      room.verification?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {room.verification?.status || 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {room.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-500">Rent:</span>
                      <span className="font-semibold ml-2 text-gray-900">{formatCurrency(room.rent.amount)}/mo</span>
                    </div>
                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-semibold ml-2 capitalize text-gray-900">{room.roomType}</span>
                    </div>
                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg flex items-center">
                      <Eye size={14} className="text-gray-500 mr-2" />
                      <span className="font-semibold text-gray-900">{room.stats.views}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-auto">
                    <Link
                      to={`/rooms/${room._id}`}
                      className="btn-secondary text-sm flex items-center space-x-2 hover:bg-gray-100"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </Link>
                    <Link
                      to={`/owner/rooms/${room._id}/edit`}
                      className="btn-secondary text-sm flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </Link>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border ${room.availability?.status === 'available' ? 'bg-green-50 text-green-600 border-green-100' :
                      room.availability?.status === 'occupied' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                      {room.availability?.status || 'Available'}
                    </div>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="btn-secondary text-sm flex items-center space-x-2 text-red-600 hover:bg-red-50 hover:border-red-100 ml-auto"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRoomsPage;
