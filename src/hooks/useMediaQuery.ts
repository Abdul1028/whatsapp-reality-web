import { useState, useEffect } from 'react';

const useMediaQuery = (query: string): boolean => {
  // Check for window object to ensure it's client-side
  const isClient = typeof window === 'object';

  const [matches, setMatches] = useState<boolean>(
    isClient ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const listener = () => setMatches(mediaQueryList.matches);

    // Initial check
    listener();

    // Use addEventListener and removeEventListener for modern browsers
    mediaQueryList.addEventListener('change', listener);

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, isClient]);

  return matches;
};

export default useMediaQuery; 