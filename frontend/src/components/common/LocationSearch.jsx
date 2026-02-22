import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, AlertCircle, Navigation, Globe, GraduationCap, Map as MapIcon, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getGeocodingSuggestions, getUserLocation } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Optimized debounce hook
 */
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

/**
 * 100% FREE LocationSearch component
 * Replaces Google Places with OpenStreetMap/Photon
 */
const LocationSearch = ({
    onLocationSelect,
    placeholder = "Search college, area or village...",
    bias = null
}) => {
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const debouncedValue = useDebounce(inputValue, 300);
    const dropdownRef = useRef(null);

    // Fetch autocomplete suggestions using FREE Photon API
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedValue || debouncedValue.length < 2) {
                setOptions([]);
                return;
            }

            setIsSearching(true);
            try {
                const results = await getGeocodingSuggestions(debouncedValue, 6, bias);
                setOptions(results);
                setShowDropdown(true);
            } catch (err) {
                console.error('Search error:', err);
                toast.error('Search failed. Please try again.');
            } finally {
                setIsSearching(false);
            }
        };

        fetchResults();
    }, [debouncedValue, bias]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        setInputValue(option.name);
        setOptions([]);
        setShowDropdown(false);

        onLocationSelect({
            latitude: option.latitude,
            longitude: option.longitude,
            name: option.name,
            formattedAddress: option.fullAddress,
            type: option.type
        });

        toast.success(`Location set: ${option.name}`);
    };

    const handleCurrentLocation = async () => {
        setIsSearching(true);
        try {
            const loc = await getUserLocation();
            onLocationSelect({
                latitude: loc.lat,
                longitude: loc.lng,
                name: 'My Current Location'
            });
            setShowDropdown(false);
            setInputValue('My Current Location');
            toast.success('Using your current location');
        } catch (err) {
            toast.error(err.message || 'Failed to get location');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${isSearching ? 'text-indigo-500 animate-pulse' : 'text-gray-400'} group-focus-within:text-indigo-500 transition-colors`} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-12 py-4 border-2 border-transparent bg-white shadow-xl rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all text-lg"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => options.length > 0 && setShowDropdown(true)}
                    autoComplete="off"
                />
                <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                    {isSearching ? (
                        <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                    ) : (
                        <button
                            onClick={handleCurrentLocation}
                            className="p-2 hover:bg-indigo-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Use current location"
                        >
                            <Navigation size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown suggestions - Premium UI */}
            <AnimatePresence>
                {showDropdown && options.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute z-[2000] mt-3 w-full bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.2)] border border-blue-50/50 overflow-hidden"
                    >
                        <div className="max-h-[450px] overflow-y-auto p-3 custom-scrollbar">
                            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nearby Locations</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>

                            {options.map((option, index) => (
                                <button
                                    key={option.id || index}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-blue-50/50 rounded-3xl transition-all group group relative overflow-hidden text-left mb-1 last:mb-0"
                                    onClick={() => handleSelect(option)}
                                >
                                    <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 shadow-sm ${option.type === 'college' || option.type === 'amenity' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {option.type === 'college' ? <GraduationCap size={20} /> : <MapPin size={20} />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="block font-black text-gray-900 group-hover:text-blue-600 transition-colors text-base truncate">
                                                {option.name}
                                            </span>
                                            {option.type === 'college' && (
                                                <span className="shrink-0 text-[8px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Education</span>
                                            )}
                                        </div>
                                        <span className="block truncate text-gray-400 font-bold text-[11px] mt-0.5 uppercase tracking-tight">
                                            {option.description || 'Nearby Area, India'}
                                        </span>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer / Tip */}
                        <div className="bg-gray-50/80 px-8 py-4 text-[10px] font-black text-gray-400 flex justify-between items-center border-t border-gray-100 uppercase tracking-[0.1em]">
                            <div className="flex items-center gap-2">
                                <Globe size={12} className="text-blue-400" />
                                <span>Powered by OpenStreetMap Data</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><MapIcon size={12} /> Locations</span>
                                <span className="flex items-center gap-1"><GraduationCap size={12} /> Colleges</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LocationSearch;
