import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Filter, X, LayoutGrid, List, SlidersHorizontal,
  Map as MapIcon, ChevronDown, CheckCircle, ArrowRight,
  TrendingDown, Star, Clock, Zap, MapPin, School, Grid,
  Bot, Sparkles, MessageSquareMore, Building, Users,
  Home, Wind, ShieldCheck, Shield, Trash2, RotateCcw,
  RefreshCw, Utensils, Monitor, Dumbbell, Layout,
  Coffee, BookOpen, Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LocationSearch from '../components/rooms/LocationSearch';
import RoomCard from '../components/rooms/RoomCard';
import MapView from '../components/rooms/MapView';

const RoomsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showAssistantPopup, setShowAssistantPopup] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    minRent: '',
    maxRent: '',
    roomTypes: [], // multiple
    amenities: [], // multiple
    genders: [], // multiple
    occupancies: [], // multiple
    furnishing: [], // multiple
    sortBy: '-createdAt',
    availability: 'all',
    availableFrom: '',
    electricityBillIncluded: '', // 'all' | 'true' | 'false'
    state: '',
    city: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [locationSearch, setLocationSearch] = useState({
    latitude: null,
    longitude: null,
    radius: 15000,
    address: ''
  });

  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const { data } = await api.get('/rooms/colleges');
        if (data.success) setColleges(data.data.colleges);
      } catch (error) {
        console.error('Failed to fetch colleges');
      }
    };
    fetchColleges();
  }, []);


  const amenitiesList = [
    { value: 'wifi', label: 'WiFi', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: 'ac', label: 'AC', icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { value: 'parking', label: 'Parking', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { value: 'security', label: 'Security', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-50' },
    { value: 'washing_machine', label: 'Laundry', icon: RefreshCw, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { value: 'water_heater', label: 'Geyser', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { value: 'kitchen', label: 'Kitchen', icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-50' },
    { value: 'tv', label: 'TV', icon: Monitor, color: 'text-purple-500', bg: 'bg-purple-50' },
    { value: 'fridge', label: 'Fridge', icon: Zap, color: 'text-sky-500', bg: 'bg-sky-50' },
    { value: 'gym', label: 'Gym', icon: Dumbbell, color: 'text-red-500', bg: 'bg-red-50' },
    { value: 'balcony', label: 'Balcony', icon: Layout, color: 'text-teal-500', bg: 'bg-teal-50' },
    { value: 'food', label: 'Food included', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-50' },
    { value: 'furnished', label: 'Furnished', icon: Home, color: 'text-stone-500', bg: 'bg-stone-50' },
    { value: 'study_room', label: 'Study Room', icon: BookOpen, color: 'text-lime-600', bg: 'bg-lime-50' },
    { value: 'water_purifier', label: 'RO Water', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' }
  ];

  const roomTypesList = [
    { value: '1RK', label: '1 RK', icon: Layout, color: 'text-amber-600', bg: 'bg-amber-50' },
    { value: '1BHK', label: '1 BHK', icon: Grid, color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: '2BHK', label: '2 BHK', icon: LayoutGrid, color: 'text-rose-600', bg: 'bg-rose-50' },
    { value: '3BHK', label: '3 BHK', icon: Building, color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'PG', label: 'PG / Co-Living', icon: Building, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'Hostel', label: 'Hostel', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { value: 'Flat', label: 'Flats / Apartment', icon: Grid, color: 'text-violet-600', bg: 'bg-violet-50' },
    { value: 'Individual', label: 'Individual Room', icon: Home, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' }
  ];

  const gendersList = [
    { value: 'any', label: 'Any Gender', icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
    { value: 'male', label: 'Boys Only', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'female', label: 'Girls Only', icon: Star, color: 'text-pink-500', bg: 'bg-pink-50' }
  ];

  const occupancyList = [
    { value: 'private', label: 'Private Room', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50' },
    { value: 'shared', label: 'Shared / Roommate', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  const furnishingList = [
    { value: 'unfurnished', label: 'Unfurnished' },
    { value: 'semi-furnished', label: 'Semi-furnished' },
    { value: 'fully-furnished', label: 'Fully-furnished' }
  ];

  const sortOptions = [
    { value: '-createdAt', label: 'Last Added', icon: Clock },
    { value: '-rating.average', label: 'Best Rated', icon: Star },
    { value: 'distance', label: 'Nearest First', icon: MapPin },
    { value: 'rent.amount', label: 'Price: Low to High', icon: TrendingDown },
  ];

  const availabilityOptions = [
    { value: 'all', label: 'All Rooms', color: 'border-gray-200 text-gray-600 bg-gray-50' },
    { value: 'now', label: 'Available Now', color: 'border-green-200 text-green-600 bg-green-50' },
    { value: 'soon', label: 'Open Soon', color: 'border-amber-200 text-amber-600 bg-amber-50' },
  ];

  useEffect(() => {
    const urlLat = searchParams.get('lat') || searchParams.get('latitude');
    const urlLng = searchParams.get('lng') || searchParams.get('longitude');
    const urlRadius = searchParams.get('radius');
    const urlSearch = searchParams.get('search');
    const urlState = searchParams.get('state');
    const urlCity = searchParams.get('city');

    if (urlLat && urlLng) {
      setLocationSearch({
        latitude: parseFloat(urlLat),
        longitude: parseFloat(urlLng),
        radius: urlRadius ? parseInt(urlRadius) : 15000,
        address: searchParams.get('address') || 'Selected Location'
      });
    }

    if (urlSearch !== null || urlState !== null || urlCity !== null) {
      setFilters(prev => ({
        ...prev,
        search: urlSearch || prev.search,
        state: urlState || prev.state,
        city: urlCity || prev.city
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchRooms(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [
    filters.search,
    filters.minRent,
    filters.maxRent,
    filters.roomTypes,
    filters.genders,
    filters.amenities,
    filters.occupancies,
    filters.furnishing,
    filters.sortBy,
    filters.availability,
    filters.availableFrom,
    filters.electricityBillIncluded,
    locationSearch.latitude,
    locationSearch.longitude,
    locationSearch.radius,
    filters.state,
    filters.city
  ]);

  const fetchRooms = async (pageNumber = 1, currentFilters = null) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);

      const searchParams = currentFilters || filters;
      const params = new URLSearchParams();
      params.append('page', pageNumber);
      params.append('limit', 15);

      if (searchParams.search?.trim()) {
        params.append('search', searchParams.search.trim());
      }

      if (searchParams.state) params.append('state', searchParams.state);
      if (searchParams.city) params.append('city', searchParams.city);

      // Viewport Bounds (OLX-Style)
      if (searchParams.neLat && searchParams.neLng) {
        params.append('neLat', searchParams.neLat);
        params.append('neLng', searchParams.neLng);
        params.append('swLat', searchParams.swLat);
        params.append('swLng', searchParams.swLng);
      }

      if (locationSearch.latitude && locationSearch.longitude) {
        params.append('latitude', locationSearch.latitude);
        params.append('longitude', locationSearch.longitude);
        params.append('radius', searchParams.radius || locationSearch.radius);
      }

      params.append('sortBy', searchParams.sortBy);

      if (filters.minRent) params.append('minRent', filters.minRent);
      if (filters.maxRent) params.append('maxRent', filters.maxRent);

      if (filters.roomTypes.length) params.append('roomType', filters.roomTypes.join(','));
      if (filters.genders.length) params.append('genderPreference', filters.genders.join(','));
      if (filters.amenities.length) params.append('amenities', filters.amenities.join(','));
      if (filters.occupancies.length) params.append('occupancy', filters.occupancies.join(','));
      if (filters.furnishing.length) params.append('furnishing', filters.furnishing.join(','));

      if (filters.availability !== 'all' && filters.availability !== '') params.append('availability', filters.availability);
      if (filters.availableFrom) params.append('availableFrom', filters.availableFrom);
      if (filters.electricityBillIncluded && filters.electricityBillIncluded !== 'all') {
        params.append('electricityBillIncluded', filters.electricityBillIncluded);
      }

      const { data } = await api.get(`/rooms?${params.toString()}`);

      const newRooms = data.data.rooms || [];
      if (pageNumber === 1) {
        setRooms(newRooms);
      } else {
        setRooms(prev => [...prev, ...newRooms]);
      }

      setHasMore(newRooms.length === 15);

      if (filters.search?.trim()) {
        setSearchParams({ search: filters.search.trim() }, { replace: true });
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
      toast.error('Failed to sync listings');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchRooms(nextPage);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleMultiSelect = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      minRent: '',
      maxRent: '',
      roomTypes: [],
      amenities: [],
      genders: [],
      occupancies: [],
      furnishing: [],
      sortBy: '-createdAt',
      availability: 'all',
      availableFrom: '',
      electricityBillIncluded: '',
      state: '',
      city: ''
    });
    setLocationSearch({ latitude: null, longitude: null, radius: 15000, address: '' });
    setSearchParams({}, { replace: true });
  };

  const displayedRooms = useMemo(() => {
    if (filters.availability === 'all') return rooms;
    const now = new Date();
    return rooms.filter(room => {
      const availableFrom = new Date(room.availability?.availableFrom || Date.now());
      if (filters.availability === 'now') return availableFrom <= now;
      if (filters.availability === 'soon') return availableFrom > now;
      return true;
    });
  }, [rooms, filters.availability]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. Enhanced Search Container */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-6 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-4 flex flex-col items-stretch gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col md:flex-row items-start gap-6 mb-4">
              <div className="flex-[1.8] w-full px-4">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                  <Grid size={12} className="opacity-70" /> Select Property Type
                </span>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {roomTypesList.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleMultiSelect('roomTypes', type.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 relative group ${filters.roomTypes.includes(type.value)
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-gray-50/50 border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-white'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${filters.roomTypes.includes(type.value) ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                        <type.icon size={16} className={filters.roomTypes.includes(type.value) ? 'text-white' : (type.color || 'text-blue-600')} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider">{type.value}</span>
                      {filters.roomTypes.includes(type.value) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <CheckCircle size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-[2] w-full relative group">
                <LocationSearch
                  initialLocation={locationSearch}
                  bias={locationSearch.latitude ? { lat: locationSearch.latitude, lon: locationSearch.longitude } : null}
                  onLocationSelect={(loc) => setLocationSearch({ ...locationSearch, ...loc })}
                  onClear={() => {
                    setLocationSearch({ latitude: null, longitude: null, radius: 15000, address: '' });
                    setFilters(prev => ({ ...prev, state: '', city: '' }));
                    setSearchParams({}, { replace: true });
                  }}
                  onStateChange={(state) => setFilters(prev => ({ ...prev, state, city: '' }))}
                  onCityChange={(city) => setFilters(prev => ({ ...prev, city }))}
                  selectedState={filters.state}
                  selectedCity={filters.city}
                  variant="minimal"
                  colleges={colleges}
                />
              </div>

              <div className="flex items-center gap-3 self-end md:self-center pr-2 shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${showFilters ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-[#0F172A] text-white shadow-gray-200 hover:bg-black'}`}
                >
                  Filters
                </button>
                <button
                  onClick={fetchRooms}
                  className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 group"
                >
                  <ArrowRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Body */}
      <div className="max-w-7xl mx-auto px-6 pt-0 pb-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
          <motion.aside
            className={`lg:col-span-3 lg:block ${showFilters ? 'block' : 'hidden md:hidden'}`}
          >
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] sticky top-20 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                    <SlidersHorizontal size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Refine Search</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Find your perfect stay</p>
                  </div>
                </div>
                {(filters.roomTypes.length > 0 || filters.amenities.length > 0 || filters.minRent || filters.maxRent) && (
                  <button
                    onClick={resetFilters}
                    className="p-2 text-gray-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50 group"
                    title="Reset Filters"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingDown size={12} className="text-blue-500" /> Monthly Rent
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minRent}
                        onChange={(e) => handleFilterChange('minRent', e.target.value)}
                        className="w-full pl-7 pr-3 py-3 bg-gray-50/50 rounded-xl text-xs font-black outline-none border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                    <div className="w-3 h-[1px] bg-gray-100" />
                    <div className="flex-1 relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxRent}
                        onChange={(e) => handleFilterChange('maxRent', e.target.value)}
                        className="w-full pl-7 pr-3 py-3 bg-gray-50/50 rounded-xl text-xs font-black outline-none border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} className="text-blue-500" /> Search Radius
                    </label>
                    <span className="text-[10px] font-black text-blue-600 uppercase">{(locationSearch.radius / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 5000, 10000, 15000, 20000].map((r) => (
                      <button
                        key={r}
                        onClick={() => setLocationSearch(prev => ({ ...prev, radius: r }))}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border-2 ${locationSearch.radius === r ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-gray-50/50 border-transparent text-gray-500 hover:border-gray-200'}`}
                      >
                        {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Home size={12} className="text-blue-500" /> Room Config
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roomTypesList.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleMultiSelect('roomTypes', opt.value)}
                        className={`group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 text-center ${filters.roomTypes.includes(opt.value) ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent shadow-lg shadow-blue-100' : 'bg-gray-50/50 border-transparent hover:border-gray-200'}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${filters.roomTypes.includes(opt.value) ? 'bg-white/20 text-white' : `${opt.bg} ${opt.color || 'text-blue-600'}`}`}>
                          <opt.icon size={16} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${filters.roomTypes.includes(opt.value) ? 'text-white' : 'text-gray-500'}`}>
                          {['1RK', '1BHK', '2BHK', '3BHK'].includes(opt.value) ? opt.label : opt.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout size={12} className="text-blue-500" /> Furnishing
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {furnishingList.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleMultiSelect('furnishing', opt.value)}
                        className={`px-3 py-2 text-[8px] font-black uppercase tracking-widest border-2 transition-all ${filters.furnishing.includes(opt.value) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-gray-50 border-transparent text-gray-500'}`}
                      >
                        {opt.label.split('-')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={12} className="text-blue-500" /> Electricity Bill
                  </label>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                    {['all', 'true', 'false'].map(val => (
                      <button
                        key={val}
                        onClick={() => handleFilterChange('electricityBillIncluded', val)}
                        className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${filters.electricityBillIncluded === val ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {val === 'all' ? 'All' : val === 'true' ? 'Included' : 'Extra'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Users size={12} className="text-blue-500" /> Preferences
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {occupancyList.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => toggleMultiSelect('occupancies', opt.value)}
                          className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-2 ${filters.occupancies.includes(opt.value) ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-gray-50/50 border-transparent text-gray-500 hover:border-gray-200'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gendersList.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => toggleMultiSelect('genders', opt.value)}
                          className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${filters.genders.includes(opt.value) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : `bg-gray-50/50 border-transparent ${opt.color} hover:border-gray-200`}`}
                        >
                          <opt.icon size={11} />
                          {opt.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} className="text-blue-500" /> Status
                    </label>
                    <div className="relative group">
                      <select
                        value={filters.availability}
                        onChange={(e) => handleFilterChange('availability', e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50/50 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border-2 border-transparent focus:border-blue-100 transition-all text-gray-700 appearance-none pr-8"
                      >
                        {availabilityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={12} className="text-blue-500" /> Sort
                    </label>
                    <div className="relative group">
                      <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50/50 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border-2 border-transparent focus:border-blue-100 transition-all text-gray-700 appearance-none pr-8"
                      >
                        {sortOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 pb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-blue-500" /> Amenities
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {amenitiesList.map((amenity) => (
                      <button
                        key={amenity.value}
                        onClick={() => toggleMultiSelect('amenities', amenity.value)}
                        className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border-2 ${filters.amenities.includes(amenity.value) ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white shadow-md' : 'bg-gray-50/50 border-transparent text-gray-400 hover:border-gray-200 hover:bg-white'}`}
                        title={amenity.label}
                      >
                        <div className={`transition-transform duration-300 group-hover:scale-110 group-active:scale-90 ${filters.amenities.includes(amenity.value) ? 'text-white' : amenity.color}`}>
                          <amenity.icon size={16} />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-tight text-center leading-none ${filters.amenities.includes(amenity.value) ? 'text-white' : 'text-gray-400'}`}>
                          {amenity.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          <main className="lg:col-span-9 space-y-6">
            {viewMode === 'map' ? (
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm h-[600px] sticky top-28">
                <MapView
                  rooms={rooms}
                  height="100%"
                  onRoomSelect={(room) => navigate(`/rooms/${room._id}`)}
                  onBoundsChange={(bounds) => {
                    const newFilters = {
                      ...filters,
                      neLat: bounds._northEast.lat,
                      neLng: bounds._northEast.lng,
                      swLat: bounds._southWest.lat,
                      swLng: bounds._southWest.lng,
                      state: '', // Bounds move overrides text search
                      city: ''
                    };
                    fetchRooms(1, newFilters);
                  }}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Showing <span className="text-gray-900 font-extrabold">{displayedRooms.length}</span> Results
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <List size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <MapIcon size={18} />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse relative">
                        <div className="h-56 bg-gray-50 rounded-3xl m-2" />
                        <div className="p-6 space-y-3">
                          <div className="h-5 bg-gray-50 rounded-lg w-3/4" />
                          <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedRooms.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Search size={32} className="text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No rooms found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term.</p>
                    <button onClick={resetFilters} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20">Clear All</button>
                  </div>
                ) : (
                  <div className="space-y-12">
                    <div className={viewMode === 'grid' ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-6"}>
                      {displayedRooms.map((room) => (
                        <RoomCard key={room._id} room={room} />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="flex justify-center pt-8">
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="px-12 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-600/10 disabled:opacity-50 flex items-center gap-3 group"
                        >
                          {loadingMore ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Loading More...
                            </>
                          ) : (
                            <>
                              See More Listings
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {showAssistantPopup && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="mb-4 w-72 bg-white rounded-[2rem] shadow-2xl border border-blue-50 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">StayHome AI</h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-blue-100">Intelligent Assistant</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-1.5 mb-2 text-blue-100">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Coming Soon</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed opacity-90">
                    We're building an AI that helps you find the best rooms near your college. Hang tight!
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-center">
                <button
                  onClick={() => setShowAssistantPopup(false)}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowAssistantPopup(!showAssistantPopup)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 group relative ${showAssistantPopup ? 'bg-gray-900' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {showAssistantPopup ? (
            <X size={24} className="text-white" />
          ) : (
            <>
              <Bot size={28} className="text-white group-hover:rotate-12 transition-transform" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black">
                1
              </div>
            </>
          )}
          {!showAssistantPopup && (
            <span className="absolute right-full mr-4 px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Ask AI Assistant
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default RoomsPage;