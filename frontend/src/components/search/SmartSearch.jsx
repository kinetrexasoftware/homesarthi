import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, GraduationCap, Map as MapIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const SmartSearch = ({ onLocationSelect, placeholder = "Search college or area...", className = "" }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const { data } = await api.get(`/colleges/search?q=${debouncedQuery}`);
                if (data.success) {
                    setResults(data.data);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item) => {
        setQuery(item.name);
        setShowDropdown(false);
        if (onLocationSelect) {
            onLocationSelect({
                latitude: item.location.coordinates[1],
                longitude: item.location.coordinates[0],
                name: item.name,
                address: item.subTitle
            });
        }
    };

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${loading ? 'text-blue-500 animate-pulse' : 'text-gray-400 group-focus-within:text-blue-500'} transition-colors`} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowDropdown(true)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-transparent shadow-xl rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-lg"
                />
                {loading && (
                    <div className="absolute inset-y-0 right-4 flex items-center">
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showDropdown && (results.length > 0 || debouncedQuery.length >= 2) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 mt-3 w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                            {results.length > 0 ? (
                                results.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 rounded-2xl transition-all group text-left border-b border-gray-50 last:border-0"
                                    >
                                        <div className={`p-3 rounded-xl ${item.type === 'college' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform`}>
                                            {item.type === 'college' ? <GraduationCap size={20} /> : <MapIcon size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 truncate">{item.name}</span>
                                                {item.verified && (
                                                    <span className="shrink-0 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                                <MapPin size={12} className="shrink-0" />
                                                {item.subTitle}
                                            </p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            ) : !loading && (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="text-gray-300" size={32} />
                                    </div>
                                    <p className="font-bold text-gray-900">No results for "{query}"</p>
                                    <p className="text-sm text-gray-500 mt-1">Try searching for a college name or nearby area.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer / Tip */}
                        <div className="bg-gray-50 px-6 py-3 text-[11px] text-gray-400 flex justify-between items-center border-t border-gray-100">
                            <span className="font-medium">TOP RESULTS FOR {query.toUpperCase()}</span>
                            <div className="flex gap-3">
                                <span className="flex items-center gap-1"><GraduationCap size={10} /> Colleges</span>
                                <span className="flex items-center gap-1"><MapIcon size={10} /> Locations</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SmartSearch;
