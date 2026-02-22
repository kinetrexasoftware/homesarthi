import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Automatically scrolls to top on route changes
 * Excludes chat routes to preserve conversation scroll position
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Exclude chat routes from auto-scroll
        if (pathname.includes('/chat')) {
            return;
        }

        // Smooth scroll to top with fallback
        const scrollToTop = () => {
            try {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
            } catch (error) {
                // Fallback for browsers that don't support smooth scroll
                window.scrollTo(0, 0);
            }
        };

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(scrollToTop, 0);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
