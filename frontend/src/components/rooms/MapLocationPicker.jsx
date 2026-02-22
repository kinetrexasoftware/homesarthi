import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { X, Check, Navigation } from 'lucide-react';
import { reverseGeocode } from '../../utils/helpers';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect, selectedLocation }) {
  const [location, setLocation] = useState(selectedLocation);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const newLocation = {
        latitude: lat,
        longitude: lng,
        address: ''
      };

      // Reverse geocode to get address
      try {
        const addressData = await reverseGeocode(lat, lng);
        newLocation.address = addressData?.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        newLocation.address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      setLocation(newLocation);
      onLocationSelect(newLocation);
    }
  });

  return null;
}

const MapLocationPicker = ({ onLocationSelect, onClose, initialLocation = null, radius = 10000 }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [loading, setLoading] = useState(false);
  const [mapType, setMapType] = useState('standard'); // 'standard' or 'satellite'

  // Map skins
  const MAP_LAYERS = {
    standard: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  };

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setAddress(initialLocation.address || '');
    }
  }, [initialLocation]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { latitude, longitude, address: '' };
        setSelectedLocation(newLoc);
        try {
          const addressData = await reverseGeocode(latitude, longitude);
          const finalAddr = addressData?.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setAddress(finalAddr);
          setSelectedLocation(prev => ({ ...prev, address: finalAddr }));
        } catch (e) {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error('Location access denied');
      }
    );
  };

  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    setAddress(location.address);

    // Update address if not already set
    if (!location.address || location.address.includes(',')) {
      setLoading(true);
      try {
        const addressData = await reverseGeocode(location.latitude, location.longitude);
        if (addressData?.address) {
          setAddress(addressData.address);
          location.address = addressData.address;
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        ...selectedLocation,
        address: address,
        radius: radius
      });
      onClose();
    } else {
      toast.error('Please select a location on the map');
    }
  };

  // Default center (Delhi, India)
  const defaultCenter = [28.6139, 77.2090];
  const center = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : defaultCenter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Select Exact Location</h2>
            <p className="text-sm text-gray-500 font-medium">Drag the map or click to drop a pin at the room entrance</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[400px]">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
              <button
                onClick={() => setMapType('standard')}
                className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${mapType === 'standard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                Map
              </button>
              <button
                onClick={() => setMapType('satellite')}
                className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                Satellite
              </button>
            </div>

            <button
              onClick={handleLocateMe}
              className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center"
              title="Locate Me"
            >
              <Navigation size={20} />
            </button>
          </div>

          <MapContainer
            center={center}
            zoom={selectedLocation ? 17 : 13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution={MAP_LAYERS[mapType].attribution}
              url={MAP_LAYERS[mapType].url}
            />

            {selectedLocation && (
              <>
                <Marker
                  position={[selectedLocation.latitude, selectedLocation.longitude]}
                />
                <Circle
                  center={[selectedLocation.latitude, selectedLocation.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: '#3B82F6',
                    fillColor: '#3B82F6',
                    fillOpacity: 0.1,
                    weight: 1,
                    dashArray: '5, 10'
                  }}
                />
              </>
            )}

            <MapClickHandler
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
          </MapContainer>
        </div>

        {/* Location Info */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading address...</p>
            </div>
          ) : selectedLocation ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Location:
                </label>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900">{address || 'Click on map to select location'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedLocation?.latitude?.toFixed(6) || '0.000000'}, {selectedLocation?.longitude?.toFixed(6) || '0.000000'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Check size={18} />
                  <span>Confirm Location</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">Click on the map to select a location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;


