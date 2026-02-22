import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Focus, ArrowRight } from 'lucide-react';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Creates a custom price bubble icon for Leaflet
 */
const createPriceIcon = (price, isSelected = false) => {
  const color = isSelected ? '#3B82F6' : '#10B981';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        border: 2px solid white;
        font-weight: bold;
        font-size: ${isSelected ? '12px' : '10px'};
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transform: translate(-50%, -100%);
      ">
        ₹${price >= 1000 ? (price / 1000).toFixed(1) + 'k' : price}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

/**
 * Map Controller to handle bounds and centering
 */
function MapController({ rooms, selectedRoom }) {
  const map = useMap();

  useEffect(() => {
    if (selectedRoom) {
      const coords = selectedRoom.location?.coordinates || [selectedRoom.longitude, selectedRoom.latitude];
      if (coords && coords.length >= 2) {
        map.setView([coords[1], coords[0]], 16, { animate: true });
      }
    } else if (rooms && rooms.length > 0) {
      const validMarkers = rooms.filter(r => (r.location?.coordinates?.length >= 2 || (r.latitude && r.longitude)));
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map(room => {
          const coords = room.location?.coordinates || [room.longitude, room.latitude];
          return [coords[1], coords[0]];
        }));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [rooms, selectedRoom, map]);

  return null;
}

/**
 * Component to handle map movement events
 */
function MapBoundsHandler({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange?.(bounds);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange?.(bounds);
    }
  });
  return null;
}

const MapView = ({ rooms, selectedRoom, onRoomSelect, height = '400px', onBoundsChange }) => {
  const [mapInstance, setMapInstance] = useState(null);

  const handleLocateMe = () => {
    if (mapInstance) {
      mapInstance.locate({ setView: true, maxZoom: 16 });
    }
  };

  const handleMarkerClick = (room) => {
    // Call the onRoomSelect callback if provided
    if (onRoomSelect) {
      onRoomSelect(room);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ height }}>
      <MapContainer
        center={[28.6139, 77.2090]} // Default to Delhi
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        whenReady={(map) => setMapInstance(map.target)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />
        <MapController rooms={rooms} selectedRoom={selectedRoom} />
        <MapBoundsHandler onBoundsChange={onBoundsChange} />

        {rooms && rooms.map((room) => {
          const coords = room.location?.coordinates || [room.longitude, room.latitude];
          if (!coords || coords.length < 2) return null;

          const isSelected = selectedRoom?._id === room._id;
          const price = room.rent?.amount || room.price || 0;

          return (
            <Marker
              key={room._id}
              position={[coords[1], coords[0]]}
              icon={createPriceIcon(price, isSelected)}
              eventHandlers={{
                click: () => handleMarkerClick(room)
              }}
            >
              <Popup className="room-popup" closeButton={true} minWidth={180}>
                <div className="p-0 min-w-[180px] -m-3">
                  {room.images?.[0]?.url && (
                    <div className="relative group cursor-pointer" onClick={() => handleMarkerClick(room)}>
                      <img
                        src={room.images[0].url}
                        alt={room.title}
                        className="w-full h-32 object-cover rounded-t-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-end justify-center pb-3">
                        <span className="text-white text-xs font-bold flex items-center gap-1">
                          <MapPin size={14} />
                          View Details
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-bold text-sm truncate text-gray-900 mb-1">{room.title}</h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500 truncate">{room.location?.address?.city || ''}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-green-600 font-black text-base">₹{price.toLocaleString()}</p>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">/month</span>
                    </div>
                    {room.roomType && (
                      <div className="mt-2 inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase">
                        {room.roomType}
                      </div>
                    )}
                  </div>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => handleMarkerClick(room)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
                    >
                      View Full Details
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Overlay Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          className="p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-lg border border-gray-100 transition-all active:scale-95"
          title="My Location"
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* Stats Overlay */}
      {rooms && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/50">
          <p className="text-xs font-black text-gray-800 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {rooms.length} Rooms Found
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
