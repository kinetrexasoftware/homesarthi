import React from 'react';
import {
  Wifi, Wind, Car, ShieldCheck, RefreshCcw,
  Flame, Utensils, Monitor, Dumbbell, Home,
  Coffee, BookOpen, Tv, Zap, Droplets
} from 'lucide-react';

/**
 * CORE LOGIC & MATHEMATICAL UTILS
 */

// Calculate distance between two coordinates using Haversine formula (km)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
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

// Point-in-Polygon validation (Ray Casting Algorithm)
export const isPointInPolygon = (lat, lng, polygon) => {
  if (!polygon || !polygon.length) return true;
  let inside = false;
  const rings = Array.isArray(polygon[0][0]) ? polygon : [polygon];
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][1], yi = ring[i][0];
      const xj = ring[j][1], yj = ring[j][0];
      const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  }
  return inside;
};

/**
 * FREE GEOCODING & SEARCH (Photon / Nominatim)
 */

const searchCache = new Map();

// Get search suggestions - 100% Free
export const getGeocodingSuggestions = async (query, limit = 5, bias = null) => {
  if (!query || query.trim().length < 2) return [];
  const cacheKey = `${query.toLowerCase()}-${JSON.stringify(bias)}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  try {
    let cleanQuery = query.trim();
    // Add city to query for much better Photon accuracy when city is selected
    if (bias && bias.city && !cleanQuery.toLowerCase().includes(bias.city.toLowerCase())) {
      cleanQuery += `, ${bias.city}`;
    }
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=15&countrycode=in`;
    if (bias && (bias.lat || bias.latitude) && (bias.lng || bias.longitude)) {
      url += `&lat=${bias.lat || bias.latitude}&lon=${bias.lng || bias.longitude}`;
    }

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.features?.length > 0) {
        let results = data.features.map(f => {
          const p = f.properties;
          const labelParts = [p.name || '', p.street || '', p.district || '', p.city || '', p.state || ''].filter(Boolean);
          const fullAddr = labelParts.join(', ');
          return {
            id: f.id || `${f.geometry.coordinates.join('-')}`,
            name: p.name || p.city || 'Unknown Location',
            description: labelParts.slice(1).join(', ') || p.country || '',
            address: fullAddr,
            fullAddress: fullAddr,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            type: p.osm_value || p.type || 'location',
            city: p.city || p.district || '',
            state: p.state || '',
            raw: f
          };
        });

        // STRICT FILTERING: If city bias is active, remove results from other cities/states
        if (bias && bias.city) {
          results = results.filter(r => {
            const searchStr = (r.fullAddress + ' ' + r.city).toLowerCase();
            const targetCity = bias.city.toLowerCase();
            // Match exact city name or ensure it's at least mentioned in the address
            return searchStr.includes(targetCity);
          });
        }

        searchCache.set(cacheKey, results.slice(0, limit));
        return results.slice(0, limit);
      }
    }
    return getGeocodingSuggestionsNominatim(query, limit);
  } catch (error) {
    return getGeocodingSuggestionsNominatim(query, limit);
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

// Forward Geocoding: Address -> Coordinates (Returns Array like Google API for compatibility)
export const geocodeAddress = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5&countrycodes=in`;
    const response = await fetch(url, { headers: { 'User-Agent': 'ROOMATE-App' } });
    const data = await response.json();
    return data.map(item => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name
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

// Alias for reverseGeocode to match RoomForm usage
export const reverseGeocodeAddress = reverseGeocode;

// Get User Current Location (Promise based)
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

/**
 * UI & FORMATTING HELPERS
 */

export const formatCurrency = (rent) => {
  const amount = typeof rent === 'object' ? rent?.amount : rent;
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDistance = (distanceInKm) => {
  if (!distanceInKm && distanceInKm !== 0) return '';
  return distanceInKm < 1 ? `${Math.round(distanceInKm * 1000)} m` : `${distanceInKm.toFixed(1)} km`;
};

// Format duration in minutes to human readable string
export const formatDuration = (durationInMinutes) => {
  if (!durationInMinutes && durationInMinutes !== 0) return '';
  if (durationInMinutes < 60) {
    return `${Math.round(durationInMinutes)} mins`;
  } else {
    const hours = Math.floor(durationInMinutes / 60);
    const mins = Math.round(durationInMinutes % 60);
    return `${hours}h ${mins}m`;
  }
};

export const formatRoomAddress = (address) => {
  if (!address) return 'Unknown Location';
  if (typeof address === 'string') return address;
  const parts = [address.street, address.city].filter(Boolean);
  return parts.join(', ') || 'Unknown Location';
};

// Render Icon Utility (Plain JS for helpers.js compatibility)
export const getAmenityIcon = (amenity) => {
  const iconProps = { size: 16 };
  const normalized = amenity?.toLowerCase().replace(/\s+/g, '_');
  const iconMap = {
    wifi: Wifi, ac: Wind, parking: Car, security: ShieldCheck, washing_machine: RefreshCcw,
    geyser: Flame, water_heater: Flame, kitchen: Utensils, tv: Tv, fridge: Zap,
    gym: Dumbbell, furnished: Home, food: Coffee, study_room: BookOpen, water_purifier: Droplets
  };
  const IconComponent = iconMap[normalized] || Home;
  return React.createElement(IconComponent, iconProps);
};

/**
 * ADVANCED MAPPING (OSRM / Overpass)
 */

export const fetchOSRMRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    return {
      geometry: data.routes[0].geometry,
      distance: data.routes[0].distance / 1000,
      duration: data.routes[0].duration / 60,
      coordinates: data.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
    };
  } catch (e) { return null; }
};

export const fetchNearbyLandmarks = async (lat, lng, radius = 2000) => {
  try {
    const query = `[out:json];(node["amenity"~"university|college|hospital"](around:${radius},${lat},${lng}););out body;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
    const data = await res.json();
    return data.elements.map(el => ({
      name: el.tags.name, type: el.tags.amenity,
      distance: calculateDistance(lat, lng, el.lat, el.lon),
      lat: el.lat, lng: el.lon
    })).sort((a, b) => a.distance - b.distance);
  } catch (e) { return []; }
};

export const buildGoogleMapsLink = (destLat, destLng) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=walking`;
};

export const fetchCityPolygon = async (city, state) => {
  try {
    const query = `${city}, ${state}, India`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ROOMATE-App' } });
    const data = await res.json();
    if (data[0]?.geojson?.type === 'Polygon' || data[0]?.geojson?.type === 'MultiPolygon') {
      return data[0].geojson.type === 'Polygon' ? [data[0].geojson.coordinates[0]] : data[0].geojson.coordinates.map(c => c[0]);
    }
    return null;
  } catch (e) { return null; }
};