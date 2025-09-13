# 🤖 AI External API Setup Guide

This guide will help you set up all the external APIs that Solyn uses for comprehensive data gathering and validation.

## 📋 Required APIs

### 1. **Google AI API (Vertex AI)** ⭐ **NEW**
**Purpose**: Advanced AI content generation using Gemini models
**Cost**: Free tier available, then pay-per-use
**Setup**:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key
4. Copy the API key (starts with AIza...)
5. Add to environment variables: `REACT_APP_GOOGLE_AI_API_KEY=your_key_here`

### 2. **Google Maps API** (Recommended)
**Purpose**: Location verification, geocoding, place details, parking information
**Cost**: $200 free credit per month, then $5 per 1000 requests
**Setup**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Geocoding API
   - Places API
   - Maps JavaScript API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security
6. Add to environment variables: `REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here`

### 2. **Phone Validation API** (Optional)
**Purpose**: Phone number verification and formatting
**Options**:
- **NumLookupAPI** (Free tier available)
- **Twilio Lookup API** (Paid)
- **Abstract API** (Free tier available)
**Setup**:
1. Sign up at [NumLookupAPI](https://numlookupapi.com/) (free tier)
2. Get your API key
3. Add to environment variables: `REACT_APP_PHONE_API_KEY=your_key_here`

### 3. **Yelp API** (Optional)
**Purpose**: Business information, reviews, hours
**Cost**: Free tier available
**Setup**:
1. Go to [Yelp Developers](https://www.yelp.com/developers)
2. Create an app
3. Get your API key
4. Add to environment variables: `REACT_APP_YELP_API_KEY=your_key_here`

### 4. **OpenWeather API** (Optional)
**Purpose**: Weather forecasts for events
**Cost**: Free tier available
**Setup**:
1. Sign up at [OpenWeather](https://openweathermap.org/api)
2. Get your API key
3. Add to environment variables: `REACT_APP_WEATHER_API_KEY=your_key_here`

## 🔧 Environment Setup

### Option 1: Environment Variables
Create a `.env` file in your project root:

```env
# Google AI API (Vertex AI)
REACT_APP_GOOGLE_AI_API_KEY=your_google_ai_key_here

# Google Maps API
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# Phone Validation API
REACT_APP_PHONE_API_KEY=your_phone_api_key_here

# Yelp API
REACT_APP_YELP_API_KEY=your_yelp_api_key_here

# Weather API
REACT_APP_WEATHER_API_KEY=your_weather_api_key_here

# Tenor API (already configured)
REACT_APP_TENOR_API_KEY=AIzaSyCbPAw3QOuuzRJjUx1_jC0wgJPtVLYxLqY
```

### Option 2: Firebase Config
Store API keys in Firebase config for better security:

```typescript
// In your Firebase config
const firebaseConfig = {
  // ... other config
  apiKeys: {
    googleMaps: 'your_key_here',
    phoneValidation: 'your_key_here',
    yelp: 'your_key_here',
    weather: 'your_key_here'
  }
};
```

## 🚀 Feature Configuration

### Enable/Disable Features
Edit `src/config/apiKeys.ts` to control which features are active:

```typescript
export const FEATURE_FLAGS = {
  ENABLE_VERTEX_AI: true,             // AI content generation
  ENABLE_GOOGLE_MAPS: true,           // Location verification
  ENABLE_PHONE_VALIDATION: true,      // Phone validation
  ENABLE_YELP: true,                  // Business information
  ENABLE_WEATHER: true,               // Weather forecasts
  ENABLE_COST_ESTIMATION: true,       // Cost estimation
  ENABLE_PARKING_INFO: true           // Parking information
};
```

### Fallback Behavior
Configure what happens when APIs are unavailable:

```typescript
export const FALLBACK_BEHAVIOR = {
  LOCATION_VERIFICATION: 'basic',   // 'basic' | 'skip'
  PHONE_VALIDATION: 'regex',        // 'regex' | 'skip'
  BUSINESS_INFO: 'skip',            // 'skip' | 'basic'
  WEATHER_FORECAST: 'skip',         // 'skip' | 'basic'
  COST_ESTIMATION: 'basic'          // 'basic' | 'skip'
};
```

## 💰 Cost Estimation

### Monthly Costs (Estimated)
- **Google AI API**: $0-30 (free tier available)
- **Google Maps API**: $0-50 (depending on usage)
- **Phone Validation**: $0-20 (free tier available)
- **Yelp API**: $0 (free tier)
- **Weather API**: $0 (free tier)
- **Total**: $0-100/month

### Usage Monitoring
The system logs all API usage. Monitor costs in:
- Google AI Studio (AI API usage)
- Google Cloud Console (Google Maps)
- NumLookupAPI Dashboard (Phone validation)
- Yelp Developer Dashboard
- OpenWeather Dashboard

## 🔒 Security Best Practices

### 1. API Key Security
- Never commit API keys to git
- Use environment variables or Firebase config
- Restrict API keys to your domain
- Rotate keys regularly

### 2. Rate Limiting
The system includes built-in rate limiting:
- Google AI: 60 requests/minute
- Google Maps: 100 requests/minute
- Phone Validation: 50 requests/minute
- Yelp: 30 requests/minute
- Weather: 60 requests/minute

### 3. Error Handling
- Graceful fallbacks when APIs fail
- Timeout protection (3-5 seconds)
- Retry logic with exponential backoff

## 🧪 Testing

### Test Without API Keys
The system will work with fallback behavior:
- Basic location validation
- Regex phone validation
- No external data enrichment

### Test With API Keys
1. Add your API keys to environment variables
2. Upload a file with event information
3. Check the validation results in the AI chat
4. Verify external data is being fetched

## 📊 Monitoring

### API Status Dashboard
Check API status in the admin panel:
- Go to Admin Dashboard
- Click "AI Permissions Audit"
- View API status and usage

### Logs
Monitor API usage in browser console:
```
API Usage: GOOGLE_MAPS - Success
API Usage: PHONE_VALIDATION - Success
API Usage: YELP - Failed - Rate limit exceeded
```

## 🆘 Troubleshooting

### Common Issues

**"API key not valid"**
- Check your API key is correct
- Verify the API is enabled in your provider's dashboard
- Check for typos in environment variables

**"Rate limit exceeded"**
- Wait for rate limit to reset
- Consider upgrading your API plan
- Check if multiple users are making requests

**"Location not found"**
- Try different address formats
- Check if the location exists in Google Maps
- Use more specific location names

**"Phone validation failed"**
- Check phone number format
- Verify the phone validation service is working
- Try with international format (+1 for US)

### Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify your API keys are valid
3. Test APIs individually using their respective dashboards
4. Check rate limits and quotas

## 🎯 Next Steps

1. **Start with Google AI API** (most important for AI features)
2. **Add Google Maps API** for location verification
3. **Add phone validation** for better contact verification
4. **Enable Yelp integration** for business information
5. **Add weather forecasts** for event planning
6. **Monitor usage and costs** regularly

The AI system will work with any combination of these APIs enabled or disabled, always falling back to basic validation when external services are unavailable.
