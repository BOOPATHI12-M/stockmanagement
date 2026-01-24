import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media query matches
 * @param {string} query - Media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create listener function
    const listener = (e) => setMatches(e.matches);
    
    // Add listener (modern way)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}

/**
 * Hook to detect if device is mobile (< 768px)
 * @returns {boolean} - true if mobile
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect if device is tablet (768px - 1023px)
 * @returns {boolean} - true if tablet
 */
export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to detect if device is desktop (>= 1024px)
 * @returns {boolean} - true if desktop
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook to get current breakpoint
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export function useBreakpoint() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  return 'desktop'; // Default
}
