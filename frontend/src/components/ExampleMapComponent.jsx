import React from 'react';
import useGoogleMaps from '../hooks/useGoogleMaps';

/**
 * Example component showing correct usage of useGoogleMaps hook
 * This is a minimal example for testing/reference
 */
const ExampleMapComponent = () => {
    // ✅ CORRECT: Pass the env var directly to the hook
    const { isLoaded, error } = useGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

    // Handle loading state
    if (!isLoaded && !error) {
        return (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
                <p>Loading Google Maps...</p>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="font-semibold">Failed to load Google Maps</p>
                <p className="text-sm mt-1">{error.message}</p>
            </div>
        );
    }

    // Handle success state
    return (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            <p className="font-semibold">✅ Google Maps loaded successfully!</p>
            <p className="text-sm mt-1">
                You can now use window.google.maps API
            </p>
            <pre className="mt-2 text-xs bg-white p-2 rounded">
                {JSON.stringify({
                    mapsAvailable: !!window.google?.maps,
                    placesAvailable: !!window.google?.maps?.places,
                }, null, 2)}
            </pre>
        </div>
    );
};

export default ExampleMapComponent;

/**
 * USAGE IN YOUR APP:
 * 
 * import ExampleMapComponent from './components/ExampleMapComponent';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <ExampleMapComponent />
 *     </div>
 *   );
 * }
 */
