// API Keys Configuration
// In production, these should be stored in environment variables or Firebase config
// For now, we'll use placeholder keys that will trigger fallback behavior

export const API_KEYS = {
  // Google Maps API - for location verification, geocoding, and place details
  GOOGLE_MAPS: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
  
  // Phone validation API - for phone number verification
  PHONE_VALIDATION: process.env.REACT_APP_PHONE_API_KEY || 'YOUR_PHONE_API_KEY',
  
  // Yelp API - for business information and reviews
  YELP: process.env.REACT_APP_YELP_API_KEY || 'YOUR_YELP_API_KEY',
  
  // OpenWeather API - for weather forecasts
  WEATHER: process.env.REACT_APP_WEATHER_API_KEY || 'YOUR_WEATHER_API_KEY',
  
  // Tenor API - for GIFs (already implemented)
  TENOR: process.env.REACT_APP_TENOR_API_KEY || 'AIzaSyCbPAw3QOuuzRJjUx1_jC0wgJPtVLYxLqY'
};

// API Configuration
export const API_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    GOOGLE_MAPS: 100, // requests per minute
    PHONE_VALIDATION: 50,
    YELP: 30,
    WEATHER: 60
  },
  
  // Timeout settings
  TIMEOUTS: {
    GOOGLE_MAPS: 5000, // 5 seconds
    PHONE_VALIDATION: 3000,
    YELP: 5000,
    WEATHER: 3000
  },
  
  // Retry settings
  RETRIES: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000 // 1 second between retries
  }
};

// Feature flags for enabling/disabling specific APIs
export const FEATURE_FLAGS = {
  ENABLE_GOOGLE_MAPS: true,
  ENABLE_PHONE_VALIDATION: true,
  ENABLE_YELP: true,
  ENABLE_WEATHER: true,
  ENABLE_COST_ESTIMATION: true,
  ENABLE_PARKING_INFO: true
};

// Fallback behavior when APIs are not available
export const FALLBACK_BEHAVIOR = {
  LOCATION_VERIFICATION: 'basic', // 'basic' | 'skip'
  PHONE_VALIDATION: 'regex', // 'regex' | 'skip'
  BUSINESS_INFO: 'skip', // 'skip' | 'basic'
  WEATHER_FORECAST: 'skip', // 'skip' | 'basic'
  COST_ESTIMATION: 'basic' // 'basic' | 'skip'
};

// API Status monitoring
export const API_STATUS = {
  GOOGLE_MAPS: 'unknown',
  PHONE_VALIDATION: 'unknown',
  YELP: 'unknown',
  WEATHER: 'unknown'
};

// Helper function to check if an API key is valid
export const isValidApiKey = (key: string): boolean => {
  return Boolean(key && key !== 'YOUR_GOOGLE_MAPS_API_KEY' && key !== 'YOUR_PHONE_API_KEY' && 
         key !== 'YOUR_YELP_API_KEY' && key !== 'YOUR_WEATHER_API_KEY');
};

// Helper function to get API status
export const getApiStatus = (apiName: keyof typeof API_STATUS): string => {
  return API_STATUS[apiName];
};

// Helper function to set API status
export const setApiStatus = (apiName: keyof typeof API_STATUS, status: string): void => {
  API_STATUS[apiName] = status;
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (featureName: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[featureName];
};

// Helper function to get fallback behavior
export const getFallbackBehavior = (behaviorName: keyof typeof FALLBACK_BEHAVIOR): string => {
  return FALLBACK_BEHAVIOR[behaviorName];
};
