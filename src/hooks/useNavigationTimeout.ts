import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseNavigationTimeoutOptions {
  timeoutMs?: number;
  onTimeout?: () => void;
  enabled?: boolean;
}

export const useNavigationTimeout = (
  isLoading: boolean,
  options: UseNavigationTimeoutOptions = {}
) => {
  const { timeoutMs = 10000, onTimeout, enabled = true } = options;
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled || !isLoading) {
      // Clear timeout if not loading or disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Start timeout when loading begins
    startTimeRef.current = Date.now();
    
    timeoutRef.current = setTimeout(() => {
      console.warn(`Navigation timeout after ${timeoutMs}ms - forcing recovery`);
      
      // Force navigation recovery
      if (onTimeout) {
        onTimeout();
      } else {
        // Default recovery: force page reload
        console.log('Forcing page reload due to navigation timeout');
        window.location.reload();
      }
    }, timeoutMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, timeoutMs, onTimeout, enabled]);

  // Return loading duration for debugging
  const getLoadingDuration = () => {
    return Date.now() - startTimeRef.current;
  };

  return { getLoadingDuration };
};
