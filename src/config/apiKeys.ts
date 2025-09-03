// API Keys Configuration - Separated by Admin and User permissions for security
export const API_KEYS = {
  // Admin API Keys - Full access for administrative functions
  ADMIN: {
    // OpenAI API Key for admin functions (AI collaboration, system monitoring, etc.)
    OPENAI: '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',
    
    // Google Maps API - Admin access for location management
    GOOGLE_MAPS: 'AIzaSyC1nkEYq0YP89BwS_An_sMc3Kn4FJY2Nos',
    
    // OpenWeather API - Admin access for weather monitoring
    OPENWEATHER: 'a769d61ef03910861ff1734bb254f87c',
    
    // Google Places API - Admin access for business information
    GOOGLE_PLACES: 'AIzaSyC1nkEYq0YP89BwS_An_sMc3Kn4FJY2Nos', // Same as Google Maps
  },
  
  // User API Keys - Limited access for regular user functions
  USER: {
    // OpenAI API Key for user functions (chat assistance, basic AI features)
    OPENAI: process.env.REACT_APP_USER_OPENAI_API_KEY || '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',
    
    // Google Maps API - User access for basic location features
    GOOGLE_MAPS: process.env.REACT_APP_USER_GOOGLE_MAPS_API_KEY || 'AIzaSyC1nkEYq0YP89BwS_An_sMc3Kn4FJY2Nos',
    
    // OpenWeather API - User access for basic weather features
    OPENWEATHER: process.env.REACT_APP_USER_OPENWEATHER_API_KEY || 'a769d61ef03910861ff1734bb254f87c',
    
    // Google Places API - User access for basic business info
    GOOGLE_PLACES: process.env.REACT_APP_USER_GOOGLE_PLACES_API_KEY || 'AIzaSyC1nkEYq0YP89BwS_An_sMc3Kn4FJY2Nos',
  },
  
  // Phone Validation API (NumLookupAPI) - Shared between admin and user
  PHONE_VALIDATION: process.env.REACT_APP_PHONE_VALIDATION_API_KEY || 'num_live_OmFTb2kLgKmdZOmOy3BAqcEA0yw81nWHMe92dN1P',
  
  // Tenor API (GIF Service) - Shared between admin and user
  TENOR: process.env.REACT_APP_TENOR_API_KEY || 'AIzaSyCbPAw3QOuuzRJjUx1_jC0wgJPtVLYxLqY',
  
  // reCAPTCHA v3 - Shared between admin and user
  RECAPTCHA: {
    SITE_KEY: process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY || '6LcDK7wrAAAAAJ52gvpmjYx5abUzCIKmg-APPKmz',
    SECRET_KEY: process.env.REACT_APP_RECAPTCHA_V3_SECRET_KEY || '6LcDK7wrAAAAAMXRAymx4JRKz-tDzwzfBlibjnDr',
  },
};

// API Configuration Settings - Separated by Admin and User permissions
export const API_CONFIG = {
  // Admin API Configuration - Full access and higher limits
  ADMIN: {
    OPENAI: {
      baseUrl: 'https://api.openai.com/v1',
      chatEndpoint: '/chat/completions',
      modelsEndpoint: '/models',
      maxRequestsPerDay: 10000, // Higher limit for admin functions
      costPerRequest: 0.002, // $0.002 per 1K tokens
      allowedModels: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
      maxTokensPerRequest: 4000,
    },
    GOOGLE_MAPS: {
      baseUrl: 'https://maps.googleapis.com/maps/api',
      geocodingEndpoint: '/geocode/json',
      placesEndpoint: '/place/details/json',
      placesSearchEndpoint: '/place/nearbysearch/json',
      maxRequestsPerDay: 5000, // Higher limit for admin
      costPerRequest: 0.005, // $5 per 1000 requests
    },
    OPENWEATHER: {
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      currentEndpoint: '/weather',
      forecastEndpoint: '/forecast',
      maxRequestsPerDay: 2000, // Higher limit for admin
      costPerRequest: 0.001, // $1 per 1000 requests
    },
    GOOGLE_PLACES: {
      baseUrl: 'https://maps.googleapis.com/maps/api',
      detailsEndpoint: '/place/details/json',
      nearbySearchEndpoint: '/place/nearbysearch/json',
      textSearchEndpoint: '/place/textsearch/json',
      maxRequestsPerDay: 5000, // Higher limit for admin
      costPerRequest: 0.017, // $17 per 1000 requests
    },
  },
  
  // User API Configuration - Limited access and lower limits
  USER: {
    OPENAI: {
      baseUrl: 'https://api.openai.com/v1',
      chatEndpoint: '/chat/completions',
      modelsEndpoint: '/models',
      maxRequestsPerDay: 1000, // Lower limit for user functions
      costPerRequest: 0.002, // $0.002 per 1K tokens
      allowedModels: ['gpt-3.5-turbo'], // Limited to cheaper model
      maxTokensPerRequest: 1000, // Lower token limit
    },
    GOOGLE_MAPS: {
      baseUrl: 'https://maps.googleapis.com/maps/api',
      geocodingEndpoint: '/geocode/json',
      placesEndpoint: '/place/details/json',
      placesSearchEndpoint: '/place/nearbysearch/json',
      maxRequestsPerDay: 1000, // Lower limit for users
      costPerRequest: 0.005, // $5 per 1000 requests
    },
    OPENWEATHER: {
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      currentEndpoint: '/weather',
      forecastEndpoint: '/forecast',
      maxRequestsPerDay: 500, // Lower limit for users
      costPerRequest: 0.001, // $1 per 1000 requests
    },
    GOOGLE_PLACES: {
      baseUrl: 'https://maps.googleapis.com/maps/api',
      detailsEndpoint: '/place/details/json',
      nearbySearchEndpoint: '/place/nearbysearch/json',
      textSearchEndpoint: '/place/textsearch/json',
      maxRequestsPerDay: 1000, // Lower limit for users
      costPerRequest: 0.017, // $17 per 1000 requests
    },
  },
  
  // Shared API Configuration
  PHONE_VALIDATION: {
    baseUrl: 'https://api.numlookupapi.com/v1',
    endpoint: '/validate',
    maxRequestsPerDay: 100, // Free tier limit
    costPerRequest: 0.01, // $0.01 per request
  },
  TENOR: {
    baseUrl: 'https://tenor.googleapis.com/v2',
    searchEndpoint: '/search',
    trendingEndpoint: '/featured',
    maxRequestsPerDay: 1000, // Free tier limit
    costPerRequest: 0.0005, // $0.50 per 1000 requests
  },
  RECAPTCHA: {
    baseUrl: 'https://www.google.com/recaptcha/api',
    siteVerifyEndpoint: 'https://www.google.com/recaptcha/api/siteverify',
    maxRequestsPerDay: 10000, // Free tier limit
    costPerRequest: 0.0, // Free tier
    minScore: 0.5, // Minimum score to consider user as human
  },
};

// Feature Flags - Control which features are enabled
export const FEATURE_FLAGS = {
  // Admin Features
  ADMIN_AI_COLLABORATION: true, // AI collaboration between organizations
  ADMIN_SYSTEM_MONITORING: true, // System monitoring and analytics
  ADMIN_ADVANCED_AI: true, // Advanced AI features for admins
  
  // User Features
  USER_CHAT_ASSISTANCE: true, // Basic chat assistance for users
  USER_BASIC_AI: true, // Basic AI features for users
  
  // Shared Features
  LOCATION_VERIFICATION: true,
  PHONE_VALIDATION: true, // Enabled with real API key
  WEATHER_INTEGRATION: true, // Enabled with real API key
  BUSINESS_INFO_ENRICHMENT: true, // Using Google Places instead of Yelp
  PARKING_INFO: true, // Using Google Places
  COST_MONITORING: true,
  FALLBACK_MODE: true, // Enable fallback when APIs fail
  GIF_INTEGRATION: true, // Enabled with Tenor API
  RECAPTCHA_PROTECTION: true, // Enabled with reCAPTCHA v3
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

// API Status Tracking - Separated by Admin and User
export const API_STATUS = {
  // Admin API Status
  ADMIN: {
    OPENAI: {
      status: 'active',
      lastCheck: new Date(),
      requestsToday: 0,
      errorsToday: 0,
    },
    GOOGLE_MAPS: {
      status: 'active',
      lastCheck: new Date(),
      requestsToday: 0,
      errorsToday: 0,
    },
    OPENWEATHER: {
      status: 'active',
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
  },
  
  // User API Status
  USER: {
    OPENAI: {
      status: 'active', // User OpenAI API key now configured
      lastCheck: new Date(),
      requestsToday: 0,
      errorsToday: 0,
    },
    GOOGLE_MAPS: {
      status: 'active', // User API key now configured
      lastCheck: new Date(),
      requestsToday: 0,
      errorsToday: 0,
    },
    OPENWEATHER: {
      status: 'active', // User API key now configured
      lastCheck: new Date(),
      requestsToday: 0,
      errorsToday: 0,
    },
    GOOGLE_PLACES: {
      status: 'active', // User API key now configured
      lastCheck: new Date(),
      requestsToday: 0,
      errorsToday: 0,
    },
  },
  
  // Shared API Status
  PHONE_VALIDATION: {
    status: 'active', // Phone validation API key now configured
    lastCheck: new Date(),
    requestsToday: 0,
    errorsToday: 0,
  },
  TENOR: {
    status: 'active', // Tenor API key now configured
    lastCheck: new Date(),
    requestsToday: 0,
    errorsToday: 0,
  },
  RECAPTCHA: {
    status: 'active', // reCAPTCHA v3 now configured
    lastCheck: new Date(),
    requestsToday: 0,
    errorsToday: 0,
  },
};

// Helper Functions - Updated for Admin/User separation
export const isValidApiKey = (key: string): boolean => {
  return Boolean(key && key !== 'demo_key' && key.length > 10);
};

export const getApiKey = (type: 'ADMIN' | 'USER', service: string): string => {
  if (type === 'ADMIN') {
    return API_KEYS.ADMIN[service as keyof typeof API_KEYS.ADMIN] || '';
  } else {
    return API_KEYS.USER[service as keyof typeof API_KEYS.USER] || '';
  }
};

export const getApiConfig = (type: 'ADMIN' | 'USER', service: string) => {
  if (type === 'ADMIN') {
    return API_CONFIG.ADMIN[service as keyof typeof API_CONFIG.ADMIN];
  } else {
    return API_CONFIG.USER[service as keyof typeof API_CONFIG.USER];
  }
};

export const getApiStatus = (type: 'ADMIN' | 'USER', service: string) => {
  if (type === 'ADMIN') {
    return API_STATUS.ADMIN[service as keyof typeof API_STATUS.ADMIN];
  } else {
    return API_STATUS.USER[service as keyof typeof API_STATUS.USER];
  }
};

export const setApiStatus = (type: 'ADMIN' | 'USER', service: string, status: any) => {
  if (type === 'ADMIN') {
    Object.assign(API_STATUS.ADMIN[service as keyof typeof API_STATUS.ADMIN], status);
  } else {
    Object.assign(API_STATUS.USER[service as keyof typeof API_STATUS.USER], status);
  }
};

export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

export const getFallbackBehavior = (service: keyof typeof FALLBACK_BEHAVIOR) => {
  return FALLBACK_BEHAVIOR[service];
};

// Cost Estimation Functions - Updated for Admin/User separation
export const estimateApiCosts = () => {
  const adminCosts = {
    openai: API_STATUS.ADMIN.OPENAI.requestsToday * API_CONFIG.ADMIN.OPENAI.costPerRequest,
    googleMaps: API_STATUS.ADMIN.GOOGLE_MAPS.requestsToday * API_CONFIG.ADMIN.GOOGLE_MAPS.costPerRequest,
    openWeather: API_STATUS.ADMIN.OPENWEATHER.requestsToday * API_CONFIG.ADMIN.OPENWEATHER.costPerRequest,
    googlePlaces: API_STATUS.ADMIN.GOOGLE_PLACES.requestsToday * API_CONFIG.ADMIN.GOOGLE_PLACES.costPerRequest,
  };
  
  const userCosts = {
    openai: API_STATUS.USER.OPENAI.requestsToday * API_CONFIG.USER.OPENAI.costPerRequest,
    googleMaps: API_STATUS.USER.GOOGLE_MAPS.requestsToday * API_CONFIG.USER.GOOGLE_MAPS.costPerRequest,
    openWeather: API_STATUS.USER.OPENWEATHER.requestsToday * API_CONFIG.USER.OPENWEATHER.costPerRequest,
    googlePlaces: API_STATUS.USER.GOOGLE_PLACES.requestsToday * API_CONFIG.USER.GOOGLE_PLACES.costPerRequest,
  };
  
  const sharedCosts = {
    phoneValidation: API_STATUS.PHONE_VALIDATION.requestsToday * API_CONFIG.PHONE_VALIDATION.costPerRequest,
  };
  
  const totalAdminCosts = Object.values(adminCosts).reduce((sum, cost) => sum + cost, 0);
  const totalUserCosts = Object.values(userCosts).reduce((sum, cost) => sum + cost, 0);
  const totalSharedCosts = Object.values(sharedCosts).reduce((sum, cost) => sum + cost, 0);
  
  return {
    daily: totalAdminCosts + totalUserCosts + totalSharedCosts,
    monthly: (totalAdminCosts + totalUserCosts + totalSharedCosts) * 30,
    admin: {
      daily: totalAdminCosts,
      monthly: totalAdminCosts * 30,
      breakdown: adminCosts,
    },
    user: {
      daily: totalUserCosts,
      monthly: totalUserCosts * 30,
      breakdown: userCosts,
    },
    shared: {
      daily: totalSharedCosts,
      monthly: totalSharedCosts * 30,
      breakdown: sharedCosts,
    },
  };
};

// API Key Validation - Updated for Admin/User separation
export const validateApiKeys = () => {
  const adminValidation = {
    openai: isValidApiKey(API_KEYS.ADMIN.OPENAI),
    googleMaps: isValidApiKey(API_KEYS.ADMIN.GOOGLE_MAPS),
    openWeather: isValidApiKey(API_KEYS.ADMIN.OPENWEATHER),
    googlePlaces: isValidApiKey(API_KEYS.ADMIN.GOOGLE_PLACES),
  };
  
  const userValidation = {
    openai: isValidApiKey(API_KEYS.USER.OPENAI),
    googleMaps: isValidApiKey(API_KEYS.USER.GOOGLE_MAPS),
    openWeather: isValidApiKey(API_KEYS.USER.OPENWEATHER),
    googlePlaces: isValidApiKey(API_KEYS.USER.GOOGLE_PLACES),
  };
  
  const sharedValidation = {
    phoneValidation: isValidApiKey(API_KEYS.PHONE_VALIDATION),
  };
  
  const allAdminValid = Object.values(adminValidation).every(Boolean);
  const allUserValid = Object.values(userValidation).every(Boolean);
  const allSharedValid = Object.values(sharedValidation).every(Boolean);
  
  return {
    admin: {
      allValid: allAdminValid,
      validKeys: Object.keys(adminValidation).filter(key => adminValidation[key as keyof typeof adminValidation]),
      invalidKeys: Object.keys(adminValidation).filter(key => !adminValidation[key as keyof typeof adminValidation]),
      validation: adminValidation,
    },
    user: {
      allValid: allUserValid,
      validKeys: Object.keys(userValidation).filter(key => userValidation[key as keyof typeof userValidation]),
      invalidKeys: Object.keys(userValidation).filter(key => !userValidation[key as keyof typeof userValidation]),
      validation: userValidation,
    },
    shared: {
      allValid: allSharedValid,
      validKeys: Object.keys(sharedValidation).filter(key => sharedValidation[key as keyof typeof sharedValidation]),
      invalidKeys: Object.keys(sharedValidation).filter(key => !sharedValidation[key as keyof typeof sharedValidation]),
      validation: sharedValidation,
    },
    overall: {
      allValid: allAdminValid && allUserValid && allSharedValid,
      adminValid: allAdminValid,
      userValid: allUserValid,
      sharedValid: allSharedValid,
    },
  };
};
