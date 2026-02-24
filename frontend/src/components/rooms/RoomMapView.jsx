import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { MapPin, Info } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const exactIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const approximateIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RoomMapView = ({ room, height = '400px', showControls = true, isAdmin = false }) => {
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [mapZoom, setMapZoom] = useState(12);
  const [isExact, setIsExact] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [mapType, setMapType] = useState('standard');

  const MAP_LAYERS = {
    standard: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri'
    }
  };

  useEffect(() => {
    if (!room?.location) return;

    const locationVisibility = room.location?.locationVisibility || 'approximate';
    const hasExactLocation = room.location?.exactLocation?.coordinates?.length === 2;

    if ((locationVisibility === 'exact' || isAdmin) && hasExactLocation) {
      const [lng, lat] = room.location.exactLocation.coordinates;
      setCoordinates([lat, lng]);
      setMapCenter([lat, lng]);
      setMapZoom(17);
      setIsExact(true);
    } else {
      const [lng, lat] = room.location.coordinates;
      setCoordinates([lat, lng]);
      setMapCenter([lat, lng]);
      setMapZoom(14);
      setIsExact(false);
    }
  }, [room, isAdmin]);

  if (!coordinates) {
    return (
      <div className="bg-gray-50 rounded-[2rem] flex items-center justify-center border border-dashed border-gray-200" style={{ height }}>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Location Preview Unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visibility Indicator */}
      <div className={`flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl border transition-all ${isExact
        ? 'bg-green-50/50 border-green-100 text-green-700'
        : 'bg-blue-50/50 border-blue-100 text-blue-700'
        }`}>
        {isExact ? <MapPin size={18} className="shrink-0" /> : <Info size={18} className="shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-70">Location Status</p>
          <p className="text-sm font-bold truncate">
            {isExact ? 'Exact door-step location shared' : 'Approximate neighborhood location'}
          </p>
        </div>
        {!isExact && (
          <div className="hidden xs:block px-2 py-0.5 bg-white rounded-md text-[9px] font-black uppercase tracking-tight border border-blue-200 shrink-0">
            Privacy Protected
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm relative" style={{ height }}>
        {/* Map Type Toggle */}
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-100 flex overflow-hidden">
            <button
              onClick={() => setMapType('standard')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${mapType === 'standard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Map
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Satellite
            </button>
          </div>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          maxZoom={isExact || isAdmin ? 20 : 15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={showControls}
          zoomControl={showControls}
        >
          <TileLayer
            attribution={MAP_LAYERS[mapType].attribution}
            url={MAP_LAYERS[mapType].url}
          />

          <Marker
            position={coordinates}
            icon={isExact ? exactIcon : approximateIcon}
          />

          {!isExact && (
            <Circle
              center={coordinates}
              radius={400}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '5, 10'
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Address Card */}
      {room.location?.address && (
        <div className="p-5 sm:p-8 bg-white border border-gray-100 rounded-2xl sm:rounded-[2.5rem] shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Verified Address</p>
          <p className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed break-words">
            {room.location.address.street && `${room.location.address.street}, `}
            {room.location.address.city}
            {room.location.address.state && `, ${room.location.address.state}`}
            {room.location.address.zipCode && ` - ${room.location.address.zipCode}`}
          </p>
          {room.location.landmark && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-blue-600">
              <MapPin size={16} />
              <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest">Near {room.location.landmark}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomMapView;


