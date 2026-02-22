import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { X, Check, MapPin, Search, Navigation, ZoomIn } from 'lucide-react';
import { reverseGeocode } from '../../utils/helpers';
import toast from 'react-hot-toast';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom red marker icon for exact location (larger and more visible)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [35, 55],
  iconAnchor: [17, 55],
  popupAnchor: [1, -34],
  shadowSize: [55, 55]
});

// Component to fix map size when modal opens
function MapSizeFixer() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size significantly to ensure tiles load correctly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Component to handle map clicks and marker dragging
function DraggableMarker({ position, onPositionChange }) {
  const [markerPosition, setMarkerPosition] = useState(position || [28.6139, 77.2090]);
  const markerRef = useRef(null);
  const map = useMap();

  // Update marker when props change
  useEffect(() => {
    if (position) {
      setMarkerPosition(position);
      // Optional: don't auto-pan on every prop update to avoid jumpiness during drags
    }
  }, [position]);

  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setMarkerPosition([lat, lng]);
      onPositionChange(lat, lng);
      // Smooth fly to new position
      map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 1 });
    }
  });

  const eventHandlers = {
    dragend: () => {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setMarkerPosition([lat, lng]);
        onPositionChange(lat, lng);
      }
    }
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={markerPosition}
      icon={redIcon}
      ref={markerRef}
    />
  );
}

// Component to control map zoom and center programmatically
function MapController({ center, zoom, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (center) {
      // Use flyTo for smoother transitions
      map.flyTo(center, zoom || 15, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);

  return null;
}

const MapPicker = ({ initialLocation = null, onConfirm, onCancel, title = 'Select Exact Location' }) => {
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false); // Delay map rendering slightly
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [coordinates, setCoordinates] = useState(
    initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      : [28.6139, 77.2090] // Default to Delhi
  );
  const [zoom, setZoom] = useState(15);
  const searchRef = useRef(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Slight delay to render map after modal animation starts
    const timer = setTimeout(() => setShowMap(true), 300);

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    };
  }, []);

  // Sync initial location
  useEffect(() => {
    if (initialLocation) {
      setCoordinates([initialLocation.latitude, initialLocation.longitude]);
      setAddress(initialLocation.address || '');
    }
  }, [initialLocation]);

  // Handle outside click for suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePositionChange = async (lat, lng) => {
    setCoordinates([lat, lng]);
    // Don't set full page loading state for drag updates, just maybe local
    try {
      // Debounce this in production, but here simple await is okay
      const addressData = await reverseGeocode(lat, lng);
      if (addressData?.address) {
        setAddress(addressData.address);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}&countrycodes=in`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'HomeSarthi-App' }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSelect = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    setCoordinates([lat, lng]);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setZoom(18);

    // Immediate visual feedback
    if (mapInstance) {
      mapInstance.flyTo([lat, lng], 18);
    }

    await handlePositionChange(lat, lng);
    toast.success('Location updated');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates([latitude, longitude]);
        setZoom(18);
        if (mapInstance) mapInstance.flyTo([latitude, longitude], 18);

        await handlePositionChange(latitude, longitude);
        toast.success('Current location found');
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        toast.error('Location access denied or unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (coordinates && coordinates.length === 2) {
      onConfirm({
        latitude: coordinates[0],
        longitude: coordinates[1],
        address: address
      });
    } else {
      toast.error('Please select a location');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <div className="sticky top-0 z-40 bg-white shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-20 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="text-blue-600" size={24} /> {title}
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  Drag the marker to pinpoint the exact location.
                </p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar - Floating or Fixed */}
            <div className="px-6 py-4 bg-white z-20 space-y-3 flex-shrink-0">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search area, street, or landmark..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold transition-all"
                />

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
                    >
                      {searchSuggestions.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearchSelect(item)}
                          className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-3"
                        >
                          <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{item.display_name.split(',')[0]}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{item.display_name}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
                >
                  {loading ? <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> : <Navigation size={14} />}
                  Use My Location
                </button>
                <button
                  onClick={() => {
                    if (mapInstance) {
                      mapInstance.setZoom(19);
                      setZoom(19);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all whitespace-nowrap"
                >
                  <ZoomIn size={14} /> Street View
                </button>
              </div>
            </div>
          </div>

          {/* Map Container - Flexible Height */}
          <div className="relative bg-gray-100 w-full overflow-hidden shrink-0 h-[400px]">
            {/* Note: overflow-hidden on this parent is CRITICAL to prevent map bleed */}
            {showMap ? (
              <MapContainer
                center={coordinates}
                zoom={zoom}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                scrollWheelZoom={true}
                zoomControl={false} // We can add custom zoom control if needed, or use default
                className="z-10"
              >
                <MapSizeFixer />
                <MapController center={coordinates} zoom={zoom} onMapReady={setMapInstance} />
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker position={coordinates} onPositionChange={handlePositionChange} />
              </MapContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-gray-400">Loading Map...</p>
                </div>
              </div>
            )}

            {/* Map Overlay Loading State */}
            {loading && (
              <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-bold text-gray-800">Updating...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 z-20">
            <div className="flex items-start gap-3 w-full sm:w-auto overflow-hidden">
              <div className="p-2 bg-red-50 text-red-500 rounded-full shrink-0">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Selected Location</p>
                <p className="text-sm font-bold text-gray-900 truncate max-w-xs md:max-w-md" title={address}>
                  {address || "No location selected"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onCancel}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> Confirm
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MapPicker;
