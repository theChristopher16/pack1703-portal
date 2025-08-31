import { useState, useEffect } from 'react';
import configService from '../services/configService';

interface UseConfigOptions {
  defaultValue?: any;
  cacheKey?: string;
  refreshInterval?: number; // in milliseconds
}

interface UseConfigReturn {
  value: any;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for accessing configuration values
 * @param key Configuration key
 * @param options Options for the hook
 * @returns Configuration value, loading state, error state, and refresh function
 */
export const useConfig = (
  key: string, 
  options: UseConfigOptions = {}
): UseConfigReturn => {
  const { defaultValue = null, cacheKey = key, refreshInterval } = options;
  const [value, setValue] = useState<any>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const configValue = await configService.getConfigValue(key);
      setValue(configValue !== null ? configValue : defaultValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      setValue(defaultValue);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Set up refresh interval if specified
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchConfig, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [key, cacheKey, refreshInterval, defaultValue]);

  const refresh = async () => {
    await fetchConfig();
  };

  return { value, loading, error, refresh };
};

/**
 * Hook for accessing multiple configuration values at once
 * @param keys Array of configuration keys
 * @param options Options for the hook
 * @returns Object with configuration values, loading state, error state, and refresh function
 */
export const useConfigs = (
  keys: string[],
  options: UseConfigOptions = {}
): Record<string, any> & { loading: boolean; error: string | null; refresh: () => Promise<void> } => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const configPromises = keys.map(async (key) => {
        try {
          const value = await configService.getConfigValue(key);
          return { key, value: value !== null ? value : options.defaultValue };
        } catch (err) {
          return { key, value: options.defaultValue };
        }
      });

      const results = await Promise.all(configPromises);
      const newValues = results.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      setValues(newValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [keys.join(','), options.defaultValue]);

  const refresh = async () => {
    await fetchConfigs();
  };

  return { ...values, loading, error, refresh };
};

/**
 * Hook for accessing configuration by category
 * @param category Configuration category
 * @param options Options for the hook
 * @returns Array of configurations in the category, loading state, error state, and refresh function
 */
export const useConfigsByCategory = (
  category: string,
  options: UseConfigOptions = {}
): { configs: any[]; loading: boolean; error: string | null; refresh: () => Promise<void> } => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigsByCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoryConfigs = await configService.getConfigsByCategory(category as any);
      setConfigs(categoryConfigs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigsByCategory();
  }, [category]);

  const refresh = async () => {
    await fetchConfigsByCategory();
  };

  return { configs, loading, error, refresh };
};

// Convenience hooks for common configuration types
export const useEmailConfig = (key: string) => useConfig(key, { defaultValue: 'pack1703@gmail.com' });
export const usePhoneConfig = (key: string) => useConfig(key, { defaultValue: '(555) 123-4567' });
export const usePackNameConfig = () => useConfig('system.pack.name', { defaultValue: 'Pack 1703' });
export const usePackLocationConfig = () => useConfig('system.pack.location', { defaultValue: 'Peoria, IL' });
export const useSiteTitleConfig = () => useConfig('display.site.title', { defaultValue: 'Pack 1703 Families Portal' });

// Hook for all contact-related configurations
export const useContactConfigs = () => {
  const { value: primaryEmail, loading: emailLoading } = useEmailConfig('contact.email.primary');
  const { value: supportEmail, loading: supportLoading } = useEmailConfig('contact.email.support');
  const { value: emergencyEmail, loading: emergencyLoading } = useEmailConfig('contact.email.emergency');
  const { value: primaryPhone, loading: phoneLoading } = usePhoneConfig('contact.phone.primary');

  return {
    primaryEmail,
    supportEmail,
    emergencyEmail,
    primaryPhone,
    loading: emailLoading || supportLoading || emergencyLoading || phoneLoading
  };
};
