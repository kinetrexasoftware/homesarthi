import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Map, X, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { geocodeAddress, reverseGeocode, getGeocodingSuggestions } from '../../utils/helpers';
import toast from 'react-hot-toast';
import MapLocationPicker from './MapLocationPicker';
import { INDIAN_STATES_CITIES } from '../../utils/locationData';

const LocationSearch = ({ onLocationSelect, onClear, initialLocation = null, variant = 'default', colleges = [], selectedState = '', selectedCity = '', onStateChange, onCityChange }) => {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [radius, setRadius] = useState(initialLocation?.radius || 15000); // Default 15km in meters
  const [geocodingTimeout, setGeocodingTimeout] = useState(null);
  const suggestionsRef = useRef(null);

  const radiusOptions = [
    { value: 1000, label: '1km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
    { value: 15000, label: '15km' },
    { value: 20000, label: '20km' }
  ];

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setAddress(initialLocation.address || '');
      if (initialLocation.radius) setRadius(initialLocation.radius);
    } else {
      setSelectedLocation(null);
      setAddress('');
      setRadius(15000);
    }
  }, [initialLocation, initialLocation?.radius]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddressChange = async (value) => {
    setAddress(value);
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (geocodingTimeout) clearTimeout(geocodingTimeout);

    const timeout = setTimeout(async () => {
      try {
        // Build a biased query if state/city are selected
        let searchQuery = value;
        let bias = null;

        if (selectedCity && selectedState) {
          const cityData = INDIAN_STATES_CITIES[selectedState]?.find(c => c.name === selectedCity);
          if (cityData) {
            bias = {
              lat: cityData.lat,
              lng: cityData.lng,
              city: selectedCity,
              state: selectedState
            };
          } else {
            searchQuery += `, ${selectedCity}`;
          }
        }

        const result = await getGeocodingSuggestions(searchQuery, 8, bias);

        // Mix in College Suggestions (Smart Matching)
        if (colleges.length > 0) {
          const normalizedSearch = value.toLowerCase().replace(/[^a-z0-9]/g, '');
          const collegeMatches = colleges.filter(c => {
            const normalizedCollegeName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const isNameMatch = normalizedCollegeName.includes(normalizedSearch);

            // If a city is selected, ideally prioritize/only show colleges in that city
            if (selectedCity) {
              const isCityMatch = (c.city || '').toLowerCase() === selectedCity.toLowerCase();
              return isNameMatch && isCityMatch;
            }
            return isNameMatch;
          }).slice(0, 5).map(c => ({
            latitude: c.coordinates.latitude,
            longitude: c.coordinates.longitude,
            address: `${c.name}, ${c.city}`,
            fullAddress: `${c.name}, ${c.city}`,
            type: 'college',
            raw: c
          }));

          if (collegeMatches.length > 0) {
            // Priority to college matches + filter out duplicates from Photon results
            const filteredResults = result.filter(r =>
              !collegeMatches.some(cm => cm.latitude === r.latitude && cm.longitude === r.longitude)
            );
            setSuggestions([...collegeMatches, ...filteredResults]);
            setShowSuggestions(true);
            return;
          }
        }

        setSuggestions(result);
        setShowSuggestions(result.length > 0);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
    setGeocodingTimeout(timeout);
  };

  const handleSuggestionSelect = async (suggestion) => {
    const location = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address,
      radius: radius,
      raw: suggestion.raw
    };
    setAddress(suggestion.address);
    setSelectedLocation(location);
    setShowSuggestions(false);
    onLocationSelect(location);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const addressData = await reverseGeocode(latitude, longitude);
        const location = {
          latitude,
          longitude,
          address: addressData?.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          radius: radius,
          raw: addressData?.raw
        };
        setSelectedLocation(location);
        setAddress(location.address);
        setLocationLoading(false);
        onLocationSelect(location);

        // Auto-fill state/city from detected location
        if (addressData?.raw?.address?.state && onStateChange) onStateChange(addressData.raw.address.state);
        if ((addressData?.raw?.address?.city || addressData?.raw?.address?.town) && onCityChange) {
          onCityChange(addressData.raw.address.city || addressData.raw.address.town);
        }

        toast.success('Location detected');
      },
      (error) => {
        setLocationLoading(false);
        toast.error('Location access denied');
      }
    );
  };

  const handleMapLocationSelect = (location) => {
    setSelectedLocation(location);
    setAddress(location.address || '');

    // Auto-fill state/city from the picked location to enable the input
    if (location.raw?.address?.state && onStateChange) {
      onStateChange(location.raw.address.state);
    }
    const detectedCity = location.raw?.address?.city || location.raw?.address?.town || location.raw?.address?.village;
    if (detectedCity && onCityChange) {
      onCityChange(detectedCity);
    }

    setShowMapPicker(false);
    onLocationSelect(location);
  };

  const handleClearInternal = () => {
    setAddress('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
  };

  const renderDropdowns = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div className="relative group">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Select State</label>
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none appearance-none transition-all"
          >
            <option value="">All States</option>
            {Object.keys(INDIAN_STATES_CITIES).sort().map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="relative group">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Select City</label>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!selectedState}
            className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none appearance-none transition-all disabled:opacity-50"
          >
            <option value="">All Cities</option>
            {selectedState && [...INDIAN_STATES_CITIES[selectedState]].sort((a, b) => a.name.localeCompare(b.name)).map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>
    </div>
  );

  if (variant === 'minimal') {
    return (
      <div className="relative w-full space-y-4">
        {renderDropdowns()}

        <div className="flex items-center gap-2 bg-gray-50/50 rounded-[2rem] p-2 border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-[0_10px_30px_-5px_rgba(59,130,246,0.1)] transition-all duration-300">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              value={address || ''}
              disabled={!selectedCity}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder={selectedCity ? `Search college, area or landmark in ${selectedCity}...` : "Search college, area or city..."}
              className={`w-full pl-12 pr-4 py-3 bg-transparent text-sm font-black text-gray-900 placeholder:text-gray-300 outline-none transition-all ${!selectedCity ? 'cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="flex items-center gap-1 pr-1">
            <button
              onClick={handleUseMyLocation}
              className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
              title="Use my location"
            >
              {locationLoading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} />}
            </button>
            <button
              onClick={() => setShowMapPicker(true)}
              className="p-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors shrink-0"
              title="Pick from map"
            >
              <Map size={18} />
            </button>
          </div>
        </div>

        {/* Suggestions Overlay - Enhanced Premium UI */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-[100] top-full left-0 md:left-auto md:right-0 md:w-[450px] w-full mt-3 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-blue-50/50 overflow-hidden backdrop-blur-xl"
            >
              <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left p-3 hover:bg-blue-50/50 rounded-2xl transition-all flex items-center gap-4 group mb-1 last:mb-0"
                  >
                    <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${suggestion.type === 'college' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                      {suggestion.type === 'college' ? <Search size={18} /> : <MapPin size={18} />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {suggestion.address.split(',')[0]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-medium truncate">
                          {suggestion.address.split(',').slice(1).join(',').trim() || 'Nearby Area'}
                        </span>
                        {suggestion.type === 'college' && (
                          <span className="shrink-0 text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Campus</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Suggestions Footer */}
              <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  {suggestions.length} Locations Found
                </span>
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Navigation size={10} className="animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Select to filter</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showMapPicker && (
          <MapLocationPicker
            onLocationSelect={handleMapLocationSelect}
            onClose={() => setShowMapPicker(false)}
            initialLocation={selectedLocation}
            radius={radius}
          />
        )}

        {/* Radius Chips for Minimal Mode */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 mr-1">Radius</span>
          {radiusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setRadius(opt.value);
                onLocationSelect({
                  ...selectedLocation,
                  radius: opt.value
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${radius === opt.value ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <MapPin className="text-blue-600" size={24} />
            Search Property
          </h3>
          <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Guided Location Discovery</p>
        </div>
        {selectedLocation && (
          <button onClick={handleClearInternal} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {renderDropdowns()}

        <div className="relative group">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Area / Building Name</label>
            {selectedCity && (
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md animate-pulse">
                Searching strictly within {selectedCity}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className={`absolute left-5 top-1/2 -translate-y-1/2 ${!selectedCity ? 'text-gray-300' : 'text-gray-400'}`} size={20} />
            <input
              type="text"
              disabled={!selectedCity}
              placeholder={selectedCity ? `Try "Gomti Nagar" or "Seva Hospital" in ${selectedCity}...` : "Please select a city first..."}
              value={address || ''}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={`w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold text-gray-900 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all ${!selectedCity ? 'cursor-not-allowed grayscale' : ''}`}
            />
          </div>

          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute z-50 w-full mt-3 bg-white border border-blue-50/50 rounded-[2rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] overflow-hidden"
              >
                <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {suggestions.length > 0 ? (
                    suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionSelect(s)}
                        className="w-full text-left p-4 hover:bg-blue-50/50 rounded-2xl transition-all flex items-center gap-4 group mb-1 last:mb-0"
                      >
                        <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${s.type === 'college' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                          {s.type === 'college' ? <Search size={20} /> : <MapPin size={20} />}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-base font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {s.address.split(',')[0]}
                          </span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-tight truncate">
                            {s.address.split(',').slice(1).join(',').trim() || 'Nearby Area'}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Navigation size={14} className="text-blue-400" />
                        </div>
                      </button>
                    ))
                  ) : address.length >= 3 && (
                    <div className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={24} className="text-blue-300" />
                      </div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-widest">No matching locations</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Try a nearby landmarks or area in {selectedCity}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleUseMyLocation}
            disabled={locationLoading}
            className="flex items-center gap-2 px-6 py-3.5 bg-gray-50 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 disabled:opacity-50"
          >
            {locationLoading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} className="text-blue-600" />}
            <span>{locationLoading ? 'Detecting...' : 'My Current Location'}</span>
          </button>
          <button
            onClick={() => setShowMapPicker(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-900/20"
          >
            <Map size={18} />
            <span>Pick on Map</span>
          </button>
        </div>

        {selectedLocation && (
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search Radius</span>
              <span className="text-xs font-black text-blue-600 uppercase tracking-tight">{radius < 1000 ? `${radius}m` : `${radius / 1000}km`} Coverage</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {radiusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRadius(opt.value);
                    onLocationSelect({ ...selectedLocation, radius: opt.value });
                  }}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${radius === opt.value ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSearch;
