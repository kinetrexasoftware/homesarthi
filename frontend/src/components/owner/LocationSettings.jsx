import { useState } from 'react';
import { MapPin, Info, Edit2, X } from 'lucide-react';
import MapPicker from './MapPicker';
import toast from 'react-hot-toast';

const LocationSettings = ({ 
  locationVisibility = 'approximate', 
  exactLocation = null,
  onVisibilityChange,
  onExactLocationChange 
}) => {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isEnabled, setIsEnabled] = useState(locationVisibility === 'exact');

  const handleToggle = (enabled) => {
    setIsEnabled(enabled);
    
    if (enabled) {
      // If enabling but no exact location set, show map picker
      if (!exactLocation || !exactLocation.latitude || !exactLocation.longitude) {
        setShowMapPicker(true);
        toast.info('Please set the exact location pin first');
      } else {
        onVisibilityChange('exact');
        toast.success('Exact location sharing enabled');
      }
    } else {
      // Disabling exact location
      onVisibilityChange('approximate');
      toast.success('Exact location sharing disabled');
    }
  };

  const handleMapPickerConfirm = (location) => {
    onExactLocationChange(location);
    onVisibilityChange('exact');
    setIsEnabled(true);
    setShowMapPicker(false);
    toast.success('Exact location set successfully');
  };

  const handleEditLocation = () => {
    setShowMapPicker(true);
  };

  const handleClearLocation = () => {
    onExactLocationChange(null);
    onVisibilityChange('approximate');
    setIsEnabled(false);
    toast.success('Exact location cleared');
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <MapPin className="mr-2 text-blue-600" size={20} />
            Location Sharing Settings
          </h3>
          <p className="text-sm text-gray-600">
            Control whether students can see your exact location for doorstep navigation
          </p>
        </div>
      </div>

      {/* Toggle Switch */}
      <div className="mb-6">
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className={`relative inline-block w-14 h-8 rounded-full transition-colors ${
                isEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isEnabled ? 'transform translate-x-6' : ''
                }`}></div>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-900 block">Share Exact Home Location</span>
              <span className="text-sm text-gray-600">
                {isEnabled 
                  ? 'Students can navigate directly to your room'
                  : 'Students will see approximate location only'
                }
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only"
          />
        </label>
      </div>

      {/* Exact Location Display */}
      {isEnabled && exactLocation && exactLocation.latitude && exactLocation.longitude ? (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <MapPin size={16} className="text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Exact Location Set</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                {exactLocation.address || `${exactLocation.latitude.toFixed(6)}, ${exactLocation.longitude.toFixed(6)}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {exactLocation.latitude.toFixed(6)}, {exactLocation.longitude.toFixed(6)}
              </p>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={handleEditLocation}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit location"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleClearLocation}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Clear location"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : isEnabled ? (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <Info size={20} className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Exact location pin required
              </p>
              <p className="text-sm text-yellow-700">
                Please set the exact location pin to enable exact location sharing.
              </p>
              <button
                onClick={() => setShowMapPicker(true)}
                className="mt-3 btn-primary text-sm"
              >
                Set Exact Location Pin
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Info Message */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <Info size={16} className="text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Privacy Note:</p>
            <p>
              When enabled, students can see your exact location and navigate directly to your room. 
              You can disable this anytime. When disabled, students will only see an approximate area (300-500m radius).
            </p>
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapPicker
          initialLocation={exactLocation}
          onConfirm={handleMapPickerConfirm}
          onCancel={() => setShowMapPicker(false)}
          title="Set Exact Location Pin"
        />
      )}
    </div>
  );
};

export default LocationSettings;


