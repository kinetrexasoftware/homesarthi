import { useState, useEffect } from 'react';

// Global state to prevent duplicate script loading
let isLoaded = false;
let isLoading = false;
let loadError = null;
const callbacks = [];

/**
 * Production-ready hook to load Google Maps JavaScript API
 * Handles script injection, prevents duplicates, and manages loading state
 * 
 * @param {string} apiKey - Google Maps API key from environment variables
 * @returns {{ isLoaded: boolean, error: Error | null }}
 */
const useGoogleMaps = (apiKey) => {
    const [loaded, setLoaded] = useState(isLoaded);
    const [error, setError] = useState(loadError);

    useEffect(() => {
        // Already loaded successfully
        if (isLoaded && window.google?.maps) {
            setLoaded(true);
            return;
        }

        // Previous load failed
        if (loadError) {
            setError(loadError);
            return;
        }

        // Validate API key
        if (!apiKey || apiKey.trim() === '') {
            const err = new Error('Google Maps API Key is missing. Check VITE_GOOGLE_MAPS_API_KEY in .env');
            console.error('❌ [useGoogleMaps]', err.message);
            loadError = err;
            setError(err);
            return;
        }

        // Script is already loading, queue this callback
        if (isLoading) {
            callbacks.push({ setLoaded, setError });
            return;
        }

        // Start loading the script
        isLoading = true;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            isLoaded = true;
            isLoading = false;
            loadError = null;

            // Notify this component
            setLoaded(true);
            setError(null);

            // Notify all queued components
            callbacks.forEach(({ setLoaded, setError }) => {
                setLoaded(true);
                setError(null);
            });
            callbacks.length = 0;

            console.log('✅ Google Maps API loaded successfully');
        };

        script.onerror = () => {
            const err = new Error('Failed to load Google Maps. Check your API key, network connection, or billing status.');
            console.error('❌ [useGoogleMaps]', err.message);

            isLoading = false;
            loadError = err;

            // Notify this component
            setError(err);

            // Notify all queued components
            callbacks.forEach(({ setError }) => setError(err));
            callbacks.length = 0;
        };

        document.head.appendChild(script);

        // Cleanup: script stays in DOM for reuse by other components
        return () => {
            // No cleanup needed
        };
    }, [apiKey]);

    return { isLoaded: loaded, error };
};

export default useGoogleMaps;
