// Feature Flags Configuration
// This file controls which features are enabled in the application

export const FEATURE_FLAGS = {
  // Admin Features
  ADMIN_AI_COLLABORATION: true, // AI collaboration using Firebase AI Logic
  ADMIN_SYSTEM_MONITORING: true, // System monitoring and analytics
  ADMIN_ADVANCED_AI: true, // Advanced AI features using Gemini
  
  // User Features
  USER_CHAT_ASSISTANCE: true, // Basic chat assistance using Firebase AI Logic
  USER_BASIC_AI: true, // Basic AI features using Gemini
  
  // Shared Features
  LOCATION_VERIFICATION: true,
  PHONE_VALIDATION: true, // Enabled with real API key
  WEATHER_INTEGRATION: true, // Enabled with real API key
  BUSINESS_INFO_ENRICHMENT: true, // Using Google Places instead of Yelp
  PARKING_INFO: true, // Using Google Places
  COST_MONITORING: true,
  FALLBACK_MODE: true,
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

