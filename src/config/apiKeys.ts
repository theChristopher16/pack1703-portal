// API Keys Configuration
export const API_KEYS = {
  // Google Maps API - Real key provided by user
  GOOGLE_MAPS: 'AIzaSyC1nkEYq0YP89BwS_An_sMc3Kn4FJY2Nos',
  
  // Phone Validation API (NumLookupAPI)
  PHONE_VALIDATION: process.env.REACT_APP_PHONE_VALIDATION_API_KEY || 'demo_key',
  
  // OpenWeather API - Real key provided by user
  OPENWEATHER: 'a769d61ef03910861ff1734bb254f87c',
  
  // Replace Yelp with Google Places API (much more cost-effective)
  // Google Places is included with Google Maps API and provides business information
  GOOGLE_PLACES: 'AIzaSyC1nkEYq0YP89BwS_An_sMc3Kn4FJY2Nos', // Same as Google Maps
};

// API Configuration Settings
export const API_CONFIG = {
  GOOGLE_MAPS: {
    baseUrl: 'https://maps.googleapis.com/maps/api',
    geocodingEndpoint: '/geocode/json',
    placesEndpoint: '/place/details/json',
    placesSearchEndpoint: '/place/nearbysearch/json',
    maxRequestsPerDay: 2500, // Free tier limit
    costPerRequest: 0.005, // $5 per 1000 requests
  },
  PHONE_VALIDATION: {
    baseUrl: 'https://api.numlookupapi.com/v1',
    endpoint: '/validate',
    maxRequestsPerDay: 100, // Free tier limit
    costPerRequest: 0.01, // $0.01 per request
  },
  OPENWEATHER: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    currentEndpoint: '/weather',
    forecastEndpoint: '/forecast',
    maxRequestsPerDay: 1000, // Free tier limit
    costPerRequest: 0.001, // $1 per 1000 requests
  },
  GOOGLE_PLACES: {
    baseUrl: 'https://maps.googleapis.com/maps/api',
    detailsEndpoint: '/place/details/json',
    nearbySearchEndpoint: '/place/nearbysearch/json',
    textSearchEndpoint: '/place/textsearch/json',
    maxRequestsPerDay: 2500, // Free tier limit
    costPerRequest: 0.017, // $17 per 1000 requests
  },
};

// Feature Flags - Control which features are enabled
export const FEATURE_FLAGS = {
  LOCATION_VERIFICATION: true,
  PHONE_VALIDATION: false, // Disabled until API key is provided
  WEATHER_INTEGRATION: true, // Enabled with real API key
  BUSINESS_INFO_ENRICHMENT: true, // Using Google Places instead of Yelp
  PARKING_INFO: true, // Using Google Places
  COST_MONITORING: true,
  FALLBACK_MODE: true, // Enable fallback when APIs fail
};

// Fallback Behavior Configuration
export const FALLBACK_BEHAVIOR = {
  LOCATION_VERIFICATION: {
    onFailure: 'skip', // Skip verification if API fails
    fallbackData: {
      verified: false,
      confidence: 'low',
      source: 'manual_entry',
    },
  },
  PHONE_VALIDATION: {
    onFailure: 'skip',
    fallbackData: {
      valid: true, // Assume valid if we can't verify
      confidence: 'low',
      source: 'assumption',
    },
  },
  WEATHER_INTEGRATION: {
    onFailure: 'skip',
    fallbackData: {
      temperature: null,
      conditions: 'unknown',
      source: 'manual_entry',
    },
  },
  BUSINESS_INFO: {
    onFailure: 'skip',
    fallbackData: {
      businessInfo: null,
      parkingInfo: null,
      source: 'manual_entry',
    },
  },
};

// API Status Tracking
export const API_STATUS = {
  GOOGLE_MAPS: {
    status: 'active',
    lastCheck: new Date(),
    requestsToday: 0,
    errorsToday: 0,
  },
  PHONE_VALIDATION: {
    status: 'inactive', // No API key provided
    lastCheck: new Date(),
    requestsToday: 0,
    errorsToday: 0,
  },
  OPENWEATHER: {
    status: 'inactive', // No API key provided
    lastCheck: new Date(),
    requestsToday: 0,
    errorsToday: 0,
  },
  GOOGLE_PLACES: {
    status: 'active',
    lastCheck: new Date(),
    requestsToday: 0,
    errorsToday: 0,
  },
};

// Helper Functions
export const isValidApiKey = (key: string): boolean => {
  return Boolean(key && key !== 'demo_key' && key.length > 10);
};

export const getApiStatus = (service: keyof typeof API_STATUS) => {
  return API_STATUS[service];
};

export const setApiStatus = (service: keyof typeof API_STATUS, status: Partial<typeof API_STATUS[typeof service]>) => {
  Object.assign(API_STATUS[service], status);
};

export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

export const getFallbackBehavior = (service: keyof typeof FALLBACK_BEHAVIOR) => {
  return FALLBACK_BEHAVIOR[service];
};

// Cost Estimation Functions
export const estimateApiCosts = () => {
  const costs = {
    googleMaps: API_STATUS.GOOGLE_MAPS.requestsToday * API_CONFIG.GOOGLE_MAPS.costPerRequest,
    phoneValidation: API_STATUS.PHONE_VALIDATION.requestsToday * API_CONFIG.PHONE_VALIDATION.costPerRequest,
    openWeather: API_STATUS.OPENWEATHER.requestsToday * API_CONFIG.OPENWEATHER.costPerRequest,
    googlePlaces: API_STATUS.GOOGLE_PLACES.requestsToday * API_CONFIG.GOOGLE_PLACES.costPerRequest,
  };
  
  return {
    daily: Object.values(costs).reduce((sum, cost) => sum + cost, 0),
    monthly: Object.values(costs).reduce((sum, cost) => sum + cost, 0) * 30,
    breakdown: costs,
  };
};

// API Key Validation
export const validateApiKeys = () => {
  const validation = {
    googleMaps: isValidApiKey(API_KEYS.GOOGLE_MAPS),
    phoneValidation: isValidApiKey(API_KEYS.PHONE_VALIDATION),
    openWeather: isValidApiKey(API_KEYS.OPENWEATHER),
    googlePlaces: isValidApiKey(API_KEYS.GOOGLE_PLACES),
  };
  
  return {
    allValid: Object.values(validation).every(Boolean),
    validKeys: Object.keys(validation).filter(key => validation[key as keyof typeof validation]),
    invalidKeys: Object.keys(validation).filter(key => !validation[key as keyof typeof validation]),
    validation,
  };
};
