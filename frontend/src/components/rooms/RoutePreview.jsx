import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { Navigation, MapPin, AlertCircle, Loader } from 'lucide-react';
import { getUserLocation, fetchOSRMRoute, buildGoogleMapsLink, formatDistance, formatDuration } from '../../utils/helpers';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit map bounds to route
function FitBounds({ coordinates }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
}

const RoutePreview = ({ destination, onNavigate }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    if (!destination) return;

    // Set map center to destination
    setMapCenter([destination.lat, destination.lng]);
    setMapZoom(14);

    // Try to get user location and calculate route
    loadRoute();
  }, [destination]);

  const loadRoute = async () => {
    if (!destination) return;

    setLoading(true);
    setError(null);

    try {
      // Get user's current location
      const userLoc = await getUserLocation();
      setUserLocation(userLoc);

      // Calculate route using OSRM
      const routeData = await fetchOSRMRoute(
        userLoc.lat,
        userLoc.lng,
        destination.lat,
        destination.lng
      );

      setRoute(routeData);

      // Adjust map to show both start and end
      const allCoords = [
        [userLoc.lat, userLoc.lng],
        ...routeData.coordinates
      ];
      const bounds = L.latLngBounds(allCoords);
      const center = bounds.getCenter();
      setMapCenter([center.lat, center.lng]);
    } catch (err) {
      console.error('Route calculation error:', err);
      setError(err.message);
      
      // Still set user location if available for direct navigation
      try {
        const userLoc = await getUserLocation();
        setUserLocation(userLoc);
      } catch (locErr) {
        // User location not available
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    if (!destination) return;

    const origin = userLocation 
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : null;

    const url = buildGoogleMapsLink(
      destination.lat,
      destination.lng,
      origin?.lat,
      origin?.lng,
      'walking'
    );

    window.open(url, '_blank', 'noopener,noreferrer');
    
    if (onNavigate) {
      onNavigate(url);
    }
  };

  if (!destination) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Route Info */}
      {loading ? (
        <div className="card p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader className="animate-spin text-blue-600" size={20} />
            <span className="text-gray-600">Calculating route...</span>
          </div>
        </div>
      ) : error ? (
        <div className="card p-4 bg-yellow-50 border border-yellow-200">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">Route calculation unavailable</p>
              <p className="text-sm text-yellow-700">{error}</p>
              {userLocation && (
                <button
                  onClick={handleNavigate}
                  className="mt-3 btn-primary text-sm"
                >
                  Open in Google Maps
                </button>
              )}
            </div>
          </div>
        </div>
      ) : route ? (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Route Preview</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <MapPin size={16} className="text-green-600" />
                <span className="text-gray-600">Start</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin size={16} className="text-red-600" />
                <span className="text-gray-600">End</span>
              </div>
            </div>
          </div>

          {/* Route Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Distance</p>
              <p className="text-lg font-bold text-blue-600">
                {formatDistance(route.distance)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Estimated Time</p>
              <p className="text-lg font-bold text-green-600">
                {formatDuration(route.duration)}
              </p>
            </div>
          </div>

          {/* Map with Route */}
          <div className="rounded-lg overflow-hidden border-2 border-gray-200" style={{ height: '300px' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Start Marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={startIcon}
                />
              )}
              
              {/* End Marker */}
              <Marker
                position={[destination.lat, destination.lng]}
                icon={endIcon}
              />
              
              {/* Route Polyline */}
              {route.coordinates && route.coordinates.length > 0 && (
                <>
                  <Polyline
                    positions={route.coordinates}
                    pathOptions={{
                      color: '#3B82F6',
                      weight: 5,
                      opacity: 0.7
                    }}
                  />
                  <FitBounds coordinates={route.coordinates} />
                </>
              )}
            </MapContainer>
          </div>

          {/* Navigate Button */}
          <button
            onClick={handleNavigate}
            className="w-full mt-4 btn-primary flex items-center justify-center space-x-2"
          >
            <Navigation size={18} />
            <span>Open in Google Maps</span>
          </button>
        </div>
      ) : (
        <div className="card p-4">
          <button
            onClick={loadRoute}
            className="w-full btn-secondary"
          >
            View Route
          </button>
        </div>
      )}
    </div>
  );
};

export default RoutePreview;


