# 🔑 API Keys Required for Pack 1703 Portal

## 📋 **Current Status**

### ✅ **ADMIN API Keys (CONFIGURED)**
These are already set up and working:

1. **Google Maps API Key** - `AIzaSyYOUR_GOOGLE_MAPS_KEY_HERE`
   - **Purpose**: Location verification, geocoding, admin location management
   - **Usage**: Admin functions only
   - **Cost**: $5 per 1000 requests
   - **Limit**: 5,000 requests/day

2. **OpenWeather API Key** - `your_openweather_key_here`
   - **Purpose**: Weather monitoring, admin weather features
   - **Usage**: Admin functions only
   - **Cost**: $1 per 1000 requests
   - **Limit**: 2,000 requests/day

3. **Google Places API Key** - `AIzaSyYOUR_GOOGLE_PLACES_KEY_HERE` (same as Google Maps)
   - **Purpose**: Business information, parking info, admin place details
   - **Usage**: Admin functions only
   - **Cost**: $17 per 1000 requests
   - **Limit**: 5,000 requests/day

**Note**: OpenAI has been removed and replaced with Firebase AI Logic (Gemini) for AI features.

---

## ❌ **USER API Keys (NEEDED)**
These are needed for regular user functions:

### 1. **User OpenAI API Key**
- **Environment Variable**: `REACT_APP_USER_OPENAI_API_KEY`
- **Purpose**: Basic chat assistance, user AI features
- **Usage**: Regular user functions
- **Cost**: $0.002 per 1K tokens
- **Limit**: 1,000 requests/day
- **Models**: Limited to `gpt-3.5-turbo` (cheaper)
- **Status**: ✅ **CONFIGURED**

### 2. **User Google Maps API Key**
- **Environment Variable**: `REACT_APP_USER_GOOGLE_MAPS_API_KEY`
- **Purpose**: Basic location features for users
- **Usage**: Regular user functions
- **Cost**: $5 per 1000 requests
- **Limit**: 1,000 requests/day
- **Status**: ✅ **CONFIGURED** (using same key as admin for now)

### 3. **User OpenWeather API Key**
- **Environment Variable**: `REACT_APP_USER_OPENWEATHER_API_KEY`
- **Purpose**: Basic weather features for users
- **Usage**: Regular user functions
- **Cost**: $1 per 1000 requests
- **Limit**: 500 requests/day
- **Status**: ✅ **CONFIGURED** (using same key as admin for now)

### 4. **User Google Places API Key**
- **Environment Variable**: `REACT_APP_USER_GOOGLE_PLACES_API_KEY`
- **Purpose**: Basic business info for users
- **Usage**: Regular user functions
- **Cost**: $17 per 1000 requests
- **Limit**: 1,000 requests/day
- **Status**: ✅ **CONFIGURED** (using same key as admin for now)

---

## ❓ **SHARED API Keys (OPTIONAL)**

### 1. **Phone Validation API Key (NumLookupAPI)**
- **Environment Variable**: `REACT_APP_PHONE_VALIDATION_API_KEY`
- **Purpose**: Phone number validation for forms
- **Usage**: Shared between admin and user
- **Cost**: $0.01 per request
- **Limit**: 100 requests/day (free tier)
- **Status**: ✅ **CONFIGURED** - Phone validation enabled
- **Note**: API key configured for form validation

---

## 🔧 **OTHER API Keys**

### 1. **Tenor API Key (GIF Service)**
- **Environment Variable**: `REACT_APP_TENOR_API_KEY`
- **Purpose**: GIF functionality in chat
- **Usage**: Shared between admin and user
- **Status**: ✅ **CONFIGURED** - GIF integration enabled
- **Note**: API key configured and tested, ready for production use

### 2. **reCAPTCHA v3 Site Key**
- **Environment Variable**: `REACT_APP_RECAPTCHA_V3_SITE_KEY`
- **Purpose**: Bot protection for forms
- **Usage**: Shared between admin and user
- **Status**: ✅ **CONFIGURED** - Bot protection enabled
- **Note**: API keys configured and integrated into login forms

---

## 📝 **How to Add User API Keys**

### Option 1: Environment Variables (Recommended)
Create a `.env` file in the root directory:

```bash
# User API Keys
REACT_APP_USER_OPENAI_API_KEY=your_user_openai_key_here
REACT_APP_USER_GOOGLE_MAPS_API_KEY=your_user_google_maps_key_here
REACT_APP_USER_OPENWEATHER_API_KEY=your_user_openweather_key_here
REACT_APP_USER_GOOGLE_PLACES_API_KEY=your_user_google_places_key_here

# Optional Shared Keys
REACT_APP_PHONE_VALIDATION_API_KEY=your_phone_validation_key_here
REACT_APP_TENOR_API_KEY=your_tenor_key_here
REACT_APP_RECAPTCHA_V3_SITE_KEY=your_recaptcha_key_here
```

### Option 2: Direct Configuration
Update `src/config/apiKeys.ts` directly:

```typescript
USER: {
  OPENAI: 'your_user_openai_key_here',
  GOOGLE_MAPS: 'your_user_google_maps_key_here',
  OPENWEATHER: 'your_user_openweather_key_here',
  GOOGLE_PLACES: 'your_user_google_places_key_here',
},
```

---

## 💰 **Cost Estimation**

### **Admin Usage (Current)**
- **Daily**: ~$0.50-2.00
- **Monthly**: ~$15-60

### **User Usage (Projected)**
- **Daily**: ~$0.10-0.50
- **Monthly**: ~$3-15

### **Total Projected**
- **Daily**: ~$0.60-2.50
- **Monthly**: ~$18-75

---

## 🎯 **Priority Order**

1. **✅ COMPLETED** - User OpenAI API Key (for chat functionality)
2. **✅ COMPLETED** - User Google Maps API Key (for location features)
3. **✅ COMPLETED** - User OpenWeather API Key (for weather features)
4. **✅ COMPLETED** - User Google Places API Key (for business info)
5. **✅ COMPLETED** - Phone Validation API Key
6. **✅ COMPLETED** - Tenor API Key (GIF functionality)
7. **✅ COMPLETED** - reCAPTCHA Site Key (Bot protection)

**🎉 ALL REQUIRED API KEYS ARE NOW CONFIGURED!**

---

## 🔒 **Security Notes**

- **Admin keys** have higher limits and access to premium features
- **User keys** have lower limits and restricted access for cost control
- **Separate keys** prevent users from accessing admin-level features
- **Environment variables** keep keys secure and out of version control
- **Cost monitoring** is built into the system to track usage

---

## 📞 **Support**

If you need help setting up any of these API keys, the system will:
- Show clear error messages when keys are missing
- Provide fallback behavior when APIs fail
- Track usage and costs automatically
- Allow you to enable/disable features as needed
