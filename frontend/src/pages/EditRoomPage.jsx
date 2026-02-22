import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';
import Loader from '../components/common/Loader';
import RoomForm from '../components/rooms/RoomForm';
import LocationSettings from '../components/owner/LocationSettings';

const EditRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationVisibility, setLocationVisibility] = useState('approximate');
  const [exactLocation, setExactLocation] = useState(null);

  useEffect(() => {
    // Wait until auth store has loaded user before fetching/validating ownership
    if (!user || !id || id === 'undefined') return;
    fetchRoom();
  }, [id, user]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rooms/${id}`);
      // Backend returns: { success, data: { room } }
      const roomData = response.data.data?.room;

      if (!roomData) {
        toast.error('Room not found');
        navigate('/owner/rooms');
        return;
      }

      // Let backend handle ownership validation on update
      // Just load the room data here - backend will reject if user doesn't own it
      setRoom(roomData);

      // Set location visibility and exact location
      setLocationVisibility(roomData.location?.locationVisibility || 'approximate');
      if (roomData.location?.exactLocation?.coordinates?.length === 2) {
        const [lng, lat] = roomData.location.exactLocation.coordinates;
        setExactLocation({
          latitude: lat,
          longitude: lng,
          address: roomData.location?.address ?
            `${roomData.location.address.street || ''}, ${roomData.location.address.city || ''}`.trim() :
            ''
        });
      } else {
        setExactLocation(null);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load room details';
      toast.error(errorMessage);
      navigate('/owner/rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);

      // Add location visibility settings to form data
      const updateData = {
        ...formData,
        locationVisibility: locationVisibility,
        exactLocation: exactLocation && exactLocation.latitude && exactLocation.longitude
          ? {
            latitude: exactLocation.latitude,
            longitude: exactLocation.longitude
          }
          : null
      };

      const response = await api.put(`/rooms/${id}`, updateData);
      const updatedRoom = response.data.data.room;

      toast.success('Room updated successfully!');
      navigate(`/rooms/${updatedRoom._id}`);
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error(error.response?.data?.message || 'Failed to update room');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/rooms/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Room Not Found</h2>
          <p className="text-gray-600 mb-4">The room you're trying to edit doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/my-rooms')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to My Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Room</h1>
        <p className="mt-2 text-gray-600">
          Update your room details and preferences
        </p>
      </div>

      {/* Room Form */}
      <div className="bg-white shadow-sm rounded-lg border p-6">
        <RoomForm
          initialData={room}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonText="Update Room"
          loading={saving}
        />
      </div>

      {/* Location Settings */}
      {room && (
        <div className="mt-6 bg-white shadow-sm rounded-lg border p-6">
          <LocationSettings
            locationVisibility={locationVisibility}
            exactLocation={exactLocation}
            onVisibilityChange={(visibility) => {
              setLocationVisibility(visibility);
            }}
            onExactLocationChange={(location) => {
              setExactLocation(location);
            }}
          />
        </div>
      )}

      {/* Additional Actions */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/my-rooms')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to My Rooms
        </button>

        <div className="text-sm text-gray-500">
          Last updated: {new Date(room.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default EditRoomPage;
