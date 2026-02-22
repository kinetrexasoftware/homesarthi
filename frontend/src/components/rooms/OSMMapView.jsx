import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Focus } from 'lucide-react';

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
    const size = isSelected ? 40 : 32;

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
        iconSize: [0, 0], // Anchor at center bottom
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
            map.setView([coords[1], coords[0]], 16, { animate: true });
        } else if (rooms && rooms.length > 0) {
            const bounds = L.latLngBounds(rooms.map(room => {
                const coords = room.location?.coordinates || [room.longitude, room.latitude];
                return [coords[1], coords[0]];
            }));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [rooms, selectedRoom, map]);

    return null;
}

const OSMMapView = ({ rooms, selectedRoom, onRoomSelect, height = '400px' }) => {
    const [mapInstance, setMapInstance] = useState(null);

    const handleLocateMe = () => {
        if (mapInstance) {
            mapInstance.locate({ setView: true, maxZoom: 16 });
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
                                click: () => onRoomSelect && onRoomSelect(room)
                            }}
                        >
                            <Popup className="room-popup">
                                <div className="p-1 min-w-[150px]">
                                    {room.images?.[0]?.url && (
                                        <img
                                            src={room.images[0].url}
                                            alt={room.title}
                                            className="w-full h-24 object-cover rounded-lg mb-2"
                                        />
                                    )}
                                    <h3 className="font-bold text-sm truncate">{room.title}</h3>
                                    <p className="text-xs text-gray-500 mb-1">{room.location?.address?.city || ''}</p>
                                    <p className="text-green-600 font-bold text-sm">₹{price}/month</p>
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
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/50">
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {rooms.length} Rooms in this area
                    </p>
                </div>
            )}
        </div>
    );
};

export default OSMMapView;
