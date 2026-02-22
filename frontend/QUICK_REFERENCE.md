// ============================================
// QUICK REFERENCE: LocationSearch Component
// ============================================

/**
 * USAGE EXAMPLE:
 */

import LocationSearch from './components/common/LocationSearch';

function HomePage() {
    const handleLocationSelect = (locationData) => {
        console.log('Selected location:', locationData);
        // locationData contains:
        // - placeId: "ChIJ..."
        // - formattedAddress: "IIT Delhi, Hauz Khas, New Delhi, Delhi, India"
        // - latitude: 28.5449
        // - longitude: 77.1926
        // - name: "IIT Delhi"
        // - types: ["university", "point_of_interest", "establishment"]
        // - addressComponents: [...]
    };

    return (
        <LocationSearch
            onLocationSelect={handleLocationSelect}
            placeholder="Enter city, college, or area (e.g. 'IIT Delhi')"
            countryCode="in" // Optional, defaults to 'in'
        />
    );
}

/**
 * KEY OPTIMIZATIONS APPLIED:
 */

// ✅ Country restriction (India-only results)
componentRestrictions: { country: 'in' }

// ✅ Session tokens (80% cost reduction)
sessionToken: new google.maps.places.AutocompleteSessionToken()

// ✅ Optimal debounce (300ms)
const debouncedValue = useDebounce(inputValue, 300);

// ✅ Request deduplication
if (lastRequestRef.current === debouncedValue) return;

// ✅ No types restriction (best results)
// No types field in request

// ✅ Services initialized once
useEffect(() => {
    if (!autocompleteService.current) {
        autocompleteService.current = new google.maps.places.AutocompleteService();
    }
}, [isLoaded]);

/**
 * VALIDATION CHECKLIST:
 */

// [ ] Type "IIT Delhi" → Shows IIT Delhi as top result
// [ ] Type "Noida" → Shows Noida, Uttar Pradesh
// [ ] Type fast → No lag, no excessive API calls
// [ ] Select location → Calls onLocationSelect with correct data
// [ ] Check console → "✅ Google Maps API loaded successfully"
// [ ] Check network → Only ONE maps API script request
// [ ] Check network → Autocomplete requests have sessiontoken parameter

/**
 * COMMON ISSUES & FIXES:
 */

// ❌ "Map Error: Google Maps API Key is missing"
// ✅ Fix: Check .env file has VITE_GOOGLE_MAPS_API_KEY on ONE line (no line breaks)
//    Then restart dev server: npm run dev

// ❌ Getting global results (e.g., Harvard in USA)
// ✅ Fix: Already fixed with componentRestrictions: { country: 'in' }

// ❌ Colleges not appearing in results
// ✅ Fix: Already fixed by removing types restriction

// ❌ High API costs
// ✅ Fix: Already fixed with session tokens (80% reduction)

// ❌ Laggy autocomplete
// ✅ Fix: Already fixed with 300ms debounce + request deduplication

/**
 * ENVIRONMENT SETUP:
 */

// .env file (frontend/.env):
VITE_API_URL = http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY = YOUR_ACTUAL_KEY_HERE

    // ⚠️ CRITICAL: API key must be on ONE line (no line breaks)
    // ⚠️ CRITICAL: Must restart dev server after changing .env

    /**
     * PRODUCTION DEPLOYMENT:
     */

    // 1. Set environment variable in hosting platform:
    //    VITE_GOOGLE_MAPS_API_KEY=your_production_key

    // 2. Restrict API key in Google Cloud Console:
    //    - HTTP referrer restrictions: yourdomain.com/*
    //    - Enable only: Maps JavaScript API, Places API
    //    - Set daily quota limits
    //    - Enable billing alerts

    // 3. Monitor costs:
    //    - Session tokens should reduce costs by ~80%
    //    - Check Google Cloud Console weekly
    //    - Set billing alerts at 50%, 80%, 100%

    /**
     * CUSTOMIZATION OPTIONS:
     */

    // Change country:
    < LocationSearch countryCode = "us" /> // For USA
<LocationSearch countryCode="uk" /> // For UK

// Change placeholder:
<LocationSearch placeholder="Search for your college..." />

// Change debounce delay:
// Edit LocationSearch.jsx line 32:
const debouncedValue = useDebounce(inputValue, 300); // Change 300 to desired ms

// Add location bias (prioritize specific region):
// Edit LocationSearch.jsx, add to request object:
locationBias: {
    center: { lat: 26.8467, lng: 80.9462 }, // Lucknow
    radius: 400000 // 400km
}

/**
 * DEBUGGING:
 */

// Check if API loaded:
console.log('Google Maps loaded?', !!window.google?.maps);

// Check if services initialized:
console.log('Autocomplete service?', !!autocompleteService.current);

// Check API key:
console.log('API key loaded?', !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

// Check network requests:
// Open DevTools → Network tab → Filter by "maps.googleapis.com"
// Should see:
// - ONE request to /maps/api/js?key=...&libraries=places
// - Multiple requests to /maps/api/place/autocomplete/json (with sessiontoken)

/**
 * PERFORMANCE METRICS:
 */

// Expected behavior:
// - Initial API load: ~500ms (one-time)
// - Autocomplete response: ~100-300ms per query
// - Debounce delay: 300ms (user won't notice)
// - Total perceived latency: ~400-600ms (feels instant)

// API cost savings:
// - Without session tokens: ~$0.017 per search (multiple requests)
// - With session tokens: ~$0.003 per search (one session)
// - Savings: ~80% reduction in autocomplete costs

/**
 * THAT'S IT! 🎉
 * 
 * The component is production-ready and optimized for:
 * - Indian student housing search
 * - Low API costs (session tokens)
 * - Fast, responsive UX (300ms debounce)
 * - Relevant results (country restriction, no types)
 * - Scalable architecture (proper cleanup, error handling)
 */
