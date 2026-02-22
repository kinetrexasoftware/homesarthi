import { Platform } from 'react-native';

export const formatCurrency = (amount) => {
    const value = typeof amount === 'object' ? amount?.amount : amount;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value || 0);
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatDistance = (distanceInMeters) => {
    if (!distanceInMeters && distanceInMeters !== 0) return '';

    if (distanceInMeters < 1000) {
        return `${Math.round(distanceInMeters)} m`;
    } else {
        const km = (distanceInMeters / 1000).toFixed(1);
        return `${km} km`;
    }
};

export const formatRoomAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);

    const baseAddress = parts.join(', ');
    if (address.landmark) {
        return `${baseAddress} (Near ${address.landmark})`;
    }

    return baseAddress || 'View on map';
};

export const getAmenityIcon = (amenity) => {
    const icons = {
        wifi: '📶',
        ac: '❄️',
        food: '🍽️',
        laundry: '🧺',
        parking: '🅿️',
        gym: '🏋️',
        study_room: '📚',
        security: '🔒',
        power_backup: '🔋',
        water_24x7: '💧',
        water_heater: '🚿',
        washing_machine: '👕',
        kitchen: '🍳',
        tv: '📺',
        fridge: '🧊',
        microwave: '⏲️',
        balcony: '🌇',
        furnished: '🛋️',
        heater: '🔥'
    };
    return icons[amenity] || '✓';
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Fetch nearby landmarks (colleges, hospitals, etc.) using Overpass API
export const fetchNearbyLandmarks = async (lat, lng, radius = 2000) => {
    try {
        const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"university|college|hospital|clinic"](around:${radius},${lat},${lng});
        way["amenity"~"university|college|hospital|clinic"](around:${radius},${lat},${lng});
        node["railway"="station"](around:${radius},${lat},${lng});
        node["highway"="bus_stop"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });

        if (!response.ok) throw new Error('Overpass API error');

        const data = await response.json();

        return data.elements
            .filter(el => el.tags && el.tags.name)
            .map(el => {
                const elLat = el.lat || (el.center ? el.center.lat : null);
                const elLng = el.lon || (el.center ? el.center.lon : null);

                let distance = null;
                if (elLat && elLng) {
                    distance = calculateDistance(lat, lng, elLat, elLng) * 1000; // Convert to meters
                }

                return {
                    id: el.id,
                    name: el.tags.name,
                    type: el.tags.amenity || el.tags.railway || el.tags.highway || 'landmark',
                    distance: distance,
                    lat: elLat,
                    lng: elLng
                };
            })
            .sort((a, b) => (a.distance || 9999) - (b.distance || 9999))
            .reduce((acc, current) => {
                const isDuplicate = acc.some(item =>
                    item.name.toLowerCase() === current.name.toLowerCase() ||
                    (current.lat && current.lng && calculateDistance(item.lat, item.lng, current.lat, current.lng) < 0.05)
                );
                if (!isDuplicate) acc.push(current);
                return acc;
            }, [])
            .slice(0, 10);

    } catch (error) {
        console.warn('Overpass landmark fetch failed:', error);
        return [];
    }
};

const searchCache = new Map();

// Get search suggestions - 100% Free (Photon/Nominatim)
// Get search suggestions - 100% Free (Photon/Nominatim)
export const getGeocodingSuggestions = async (query, limit = 8, bias = null) => {
    if (!query || query.trim().length < 2) return [];

    // Clean query from common Indian filler words
    let cleanQuery = query.trim().replace(/\s+(near|in|at)\s*$/i, '');

    const cacheKey = `${cleanQuery.toLowerCase()}-${JSON.stringify(bias)}`;
    if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

    try {
        // 1. PHOTON API WITH BIASING (Very Fast)
        let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=15&countrycode=in&lang=en`;

        // Add Location Biasing if available
        if (bias && bias.latitude && bias.longitude) {
            url += `&lat=${bias.latitude}&lon=${bias.longitude}`;
        } else if (bias && bias.lat && bias.lng) {
            url += `&lat=${bias.lat}&lon=${bias.lng}`;
        }

        const response = await fetch(url);
        let results = [];

        if (response.ok) {
            const data = await response.json();
            if (data.features?.length > 0) {
                results = data.features.map(f => {
                    const p = f.properties;
                    // Build a better label
                    const labelParts = [
                        p.name || '',
                        p.street || '',
                        p.district || p.locality || p.suburb || '',
                        p.city || p.town || '',
                        p.state || ''
                    ].filter(Boolean);

                    // Remove duplicates from label parts
                    const uniqueParts = [];
                    const seen = new Set();
                    labelParts.forEach(part => {
                        const low = part.toLowerCase().trim();
                        if (!seen.has(low)) {
                            uniqueParts.push(part);
                            seen.add(low);
                        }
                    });

                    const fullAddr = uniqueParts.join(', ');

                    return {
                        id: f.id || `${f.geometry.coordinates.join('-')}`,
                        name: p.name || p.city || p.district || 'Unknown Location',
                        description: uniqueParts.slice(1).join(', ') || p.country || '',
                        address: fullAddr,
                        fullAddress: fullAddr,
                        latitude: f.geometry.coordinates[1],
                        longitude: f.geometry.coordinates[0],
                        lat: f.geometry.coordinates[1],
                        lng: f.geometry.coordinates[0],
                        type: p.osm_value || p.type || 'location',
                        city: p.city || p.district || p.county || '',
                        state: p.state || '',
                        postcode: p.postcode || '',
                        raw: f
                    };
                });
            }
        }

        // 2. BROAD SEARCH FALLBACK (If limited results or poor quality)
        if (results.length < 3) {
            const nominatimResults = await getGeocodingSuggestionsNominatim(cleanQuery, limit);
            // Merge results, avoiding duplicates by coordinate proximity
            nominatimResults.forEach(nr => {
                const isDuplicate = results.some(r =>
                    Math.abs(r.lat - nr.lat) < 0.001 && Math.abs(r.lng - nr.lng) < 0.001
                );
                if (!isDuplicate) {
                    results.push(nr);
                }
            });
        }

        // 3. STRICT FILTERING & PRIORITIZATION logic
        if (bias) {
            const stateLower = (bias.state || '').toLowerCase();
            const cityLower = (bias.city || '').toLowerCase();

            // If we have state/city, filter results to stay within that region
            if (stateLower || cityLower) {
                results = results.filter(r => {
                    const matchState = !stateLower || (r.state || '').toLowerCase().includes(stateLower) || (r.address || '').toLowerCase().includes(stateLower);
                    const matchCity = !cityLower || (r.city || '').toLowerCase().includes(cityLower) || (r.address || '').toLowerCase().includes(cityLower);
                    return matchState && matchCity;
                });
            }

            // If filtering left us with too few results, and we have broad results from fallbacks,
            // we could keep some, but the user requested "ONLY" from selected area.

            // Sort to ensure the best matches are top
            if (cityLower) {
                results.sort((a, b) => {
                    const aInCity = (a.city || '').toLowerCase().includes(cityLower) || (a.address || '').toLowerCase().includes(cityLower);
                    const bInCity = (b.city || '').toLowerCase().includes(cityLower) || (b.address || '').toLowerCase().includes(cityLower);
                    if (aInCity && !bInCity) return -1;
                    if (!aInCity && bInCity) return 1;
                    return 0;
                });
            }
        }

        searchCache.set(cacheKey, results.slice(0, limit));
        return results.slice(0, limit);
    } catch (error) {
        console.error('Geocoding error:', error);
        return getGeocodingSuggestionsNominatim(cleanQuery, limit);
    }
};

export const getGeocodingSuggestionsNominatim = async (query, limit = 5) => {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' India')}&format=json&addressdetails=1&limit=${limit}&countrycodes=in`;
        const response = await fetch(url, { headers: { 'User-Agent': 'ROOMATE-App' } });
        const data = await response.json();
        return data.map(item => ({
            id: item.place_id,
            name: item.display_name.split(',')[0],
            description: item.display_name.split(',').slice(1).join(',').trim(),
            address: item.display_name,
            fullAddress: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type || 'location',
            raw: item
        }));
    } catch (e) { return []; }
};

// Reverse Geocoding: Coordinates -> Address
export const reverseGeocode = async (lat, lng) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'ROOMATE-App', 'Accept-Language': 'en' } });
        const data = await response.json();
        return {
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village || data.address?.district || '',
            state: data.address?.state || '',
            pincode: data.address?.postcode || '',
            raw: data
        };
    } catch (e) { return null; }
};
