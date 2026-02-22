import { Link } from 'react-router-dom';
import { MapPin, Heart, ShieldCheck, Star, Zap, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatCurrency, getAmenityIcon, formatRoomAddress } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const RoomCard = ({ room, onFavoriteToggle }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Status and Availability Logic
  const availabilityInfo = useMemo(() => {
    const now = new Date();
    const availableFrom = new Date(room.availability?.availableFrom || Date.now());
    const isFuture = availableFrom > now;

    if (isFuture) {
      const diffTime = Math.abs(availableFrom - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        label: `Opens in ${diffDays} days`,
        type: 'soon',
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        bgSoft: 'bg-amber-50'
      };
    }

    return {
      label: 'Available Now',
      type: 'now',
      color: 'bg-green-500',
      textColor: 'text-green-500',
      bgSoft: 'bg-green-50'
    };
  }, [room.availability]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`/rooms/${room._id}/favorite`);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      if (onFavoriteToggle) onFavoriteToggle();
    } catch (error) {
      toast.error('Please login to add favorites');
    } finally {
      setLoading(false);
    }
  };

  const distanceText = useMemo(() => {
    if (!room.distance) return null;
    const meters = typeof room.distance === 'number' ? room.distance : room.distance.meters;
    if (!meters) return null;
    return `${(meters / 1000).toFixed(1)} km away`;
  }, [room.distance]);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 transition-all overflow-hidden relative h-full flex flex-col"
    >
      <Link to={`/rooms/${room._id}`} className="absolute inset-0 z-10" />

      {/* Image Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <img
          src={room.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={room.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

        {/* Floating Badges */}
        <div className="absolute top-5 left-5 flex flex-col gap-2 z-20">
          {room.featured && (
            <div className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
              <Star size={10} className="fill-white" /> Featured
            </div>
          )}
          <div className={`px-3 py-1.5 ${availabilityInfo.color} text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5`}>
            {availabilityInfo.type === 'now' ? <Zap size={10} className="fill-white" /> : <Clock size={10} />}
            {availabilityInfo.label}
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          disabled={loading}
          className="absolute top-5 right-5 p-3.5 bg-white/90 backdrop-blur-md rounded-2xl hover:bg-white transition-all shadow-xl z-20 group/heart"
        >
          <Heart
            size={18}
            className={`transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500 scale-125' : 'text-gray-400 group-hover/heart:text-red-500'}`}
          />
        </button>

        {/* Bottom Image Overlay Labels */}
        <div className="absolute bottom-5 left-5 right-5 text-white z-20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 backdrop-blur-md rounded-lg border border-white/20 text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5 ${['1RK', '1BHK', '2BHK', '3BHK'].includes(room.roomType) ? 'bg-amber-600/60 text-white' :
              room.roomType === 'PG' ? 'bg-blue-600/60 text-white' :
                room.roomType === 'Hostel' ? 'bg-indigo-600/60 text-white' :
                  room.roomType === 'Flat' ? 'bg-violet-600/60 text-white' :
                    'bg-fuchsia-600/60 text-white'
              }`}>
              {room.roomType}
            </div>
            <div className="px-3 py-1.5 bg-gray-900/40 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest">
              {room.furnishing?.replace('-', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-7 flex-1 flex flex-col relative z-20 pointer-events-none">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-black text-gray-900 line-clamp-1 leading-tight group-hover:text-blue-600 transition-colors">
            {room.title}
          </h3>
          {room.owner?.verified && (
            <div className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-1" title="Verified Owner">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Verified</span>
            </div>
          )}
        </div>

        {/* Location & Address */}
        <div className="flex items-center gap-2 mb-3 text-gray-400">
          <MapPin size={16} className="text-blue-500 shrink-0" />
          <p className="text-xs font-black truncate text-gray-500 uppercase tracking-widest">
            Near <span className="text-gray-900">{formatRoomAddress(room.location?.address)}</span>
          </p>
        </div>

        {/* Dynamic Distance Badge (Startup Premium Style) */}
        {distanceText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl mb-4 self-start"
          >
            <MapPin size={12} className="fill-blue-600/10" strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-wider">{distanceText}</span>
          </motion.div>
        )}

        {/* Footer Info */}
        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Rent</span>
              {room.rent?.electricityBillIncluded && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded-md border border-yellow-100" title="Electricity Included">
                  <Zap size={8} className="fill-yellow-500" />
                  <span className="text-[8px] font-black uppercase">Inc.</span>
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">{formatCurrency(room.rent)}</span>
              <span className="text-xs font-bold text-gray-400">/mo</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            {room.amenities?.slice(0, 3).map((amenity, idx) => (
              <div
                key={idx}
                className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors"
                title={amenity}
              >
                {getAmenityIcon(amenity)}
              </div>
            ))}
            {room.amenities?.length > 3 && (
              <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                +{room.amenities.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;