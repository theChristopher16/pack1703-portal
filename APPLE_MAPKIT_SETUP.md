# 🍎 Apple MapKit JS Setup Guide

This guide will walk you through setting up Apple MapKit JS for the locations component.

## 📋 Prerequisites

- Apple Developer account ($99/year) OR existing Apple ID with developer access
- Node.js installed on your system

## 🚀 Setup Steps

### Step 1: Apple Developer Account Setup

1. **Sign up/Login** at [developer.apple.com](https://developer.apple.com)
2. Navigate to **"Certificates, Identifiers & Profiles"**
3. Click **"Keys"** in the sidebar
4. Click the **"+"** button to create a new MapKit key

### Step 2: Create MapKit Key

1. **Name**: Enter "MapKit JS Web Key" (or any descriptive name)
2. **Services**: Check **"MapKit JS"** ✅
3. Click **"Continue"** → **"Register"**
4. **Download** the `.p8` file (private key) - you can only download this once!
5. **Note down** your Key ID and Team ID (both are 10-digit codes)

### Step 3: Configure the Token Generator

1. Open `scripts/generate-mapkit-token.js`
2. Replace these values with your actual Apple Developer credentials:

```javascript
const APPLE_KEY_ID = 'ABC123DEF4';           // Your 10-digit Key ID
const APPLE_TEAM_ID = 'ABCD123456';         // Your 10-digit Team ID
const APPLE_ORIGIN = 'http://localhost:3000'; // Your domain
const APPLE_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
[M2FsdGVkX1+vupppZksvRf5pq5g5XjFRlipRkyYZgAAAAAAAAAAA............
-----END PRIVATE KEY-----
`;
```

### Step 4: Generate Your First Token

Run the token generator:
```bash
node scripts/generate-mapkit-token.js
```

You'll see output like:
```
✅ Apple MapKit JS Token Generated Successfully!
🔑 Your Token: eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIs...
🌐 Origin: http://localhost:3000
⏰ Expires: 2024-09-30T01:58:15.142Z
```

### Step 5: Add Token to Your App

Replace the placeholder in your Apple Maps component:

**File**: `src/components/Locations/AppleLocationMap.tsx`

**Find this line** (around line 50):
```javascript
done('YOUR_MAPKIT_JS_TOKEN'); // Replace with a valid token
```

**Replace with your generated token**:
```javascript
done('eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIs...'); // Your actual token
```

## 🔄 Token Management

### Automatic Token Refresh
You'll need to generate new tokens periodically since they expire after 24 hours. Consider:

1. **Automate token generation** in your deployment pipeline
2. **Implement token refresh** on the server side
3. **Use environment variables** for sensitive data

### Server-Side Token Generation (Recommended)
For production, move token generation to your backend:

```javascript
// In your Firebase Cloud Functions or API endpoint
app.get('/api/mapkit-token', (req, res) => {
  const token = generateMapKitToken();
  res.json({ token });
});
```

Then fetch it in your component:
```javascript
const response = await fetch('/api/mapkit-token');
const { token } = await response.json();
done(token);
```

## 🌐 Domain Configuration

### Development
- `http://localhost:3000` (default)
- `http://127.0.0.1:3000`

### Production
- Your actual domain (e.g., `https://pack1703-portal.web.app`)
- Update the `APPLE_ORIGIN` in the token generator

## 🔒 Security Considerations

1. **Never commit** your `.p8` private key file to version control
2. **Use environment variables** for production keys
3. **Rotate keys annually** or if compromised
4. **Implement rate limiting** on your token endpoint

## 🐛 Troubleshooting

### Common Issues

**1. "Token is invalid" Error**
- Check that your Key ID and Team ID are correct
- Ensure the private key includes the proper header/footer lines
- Verify the token hasn't expired (>24 hours old)

**2. "Origin not allowed" Error**
- Check that your `APPLE_ORIGIN` matches exactly what you see in the browser
- Ensure you've registered the correct domain in your Apple Developer account

**3. "MapKit JS not loaded" Warning**
- Check browser console for script loading errors
- Verify internet connection for CDN access
- Ensure the script tag is in your HTML

### Debug Steps

1. **Check Console**: Look for specific error messages
2. **Verify Token**: Copy your token to jwt.io to decode and validate
3. **Network Tab**: Ensure MapKit scripts are loading from Apple's CDN
4. **Domain Match**: Make sure your domain exactly matches APPLE_ORIGIN

## 💰 Costs

- **Apple Developer Account**: $99/year
- **MapKit JS Usage**: 
  - First 250,000 map loads/month: FREE
  - Additional loads: $0.40 per 1,000 loads
  - You get 250k free map loads per month!

## 🆘 Need Help?

If you encounter issues:

1. **Check Apple's Documentation**: [developer.apple.com/maps/mapkitjs](https://developer.apple.com/maps/mapkitjs)
2. **Apple Developer Support**: Through your developer account portal
3. **Community Forums**: Apple Developer Forums for MapKit

## 🎯 Quick Setup Checklist

- [ ] Apple Developer account ✅
- [ ] MapKit JS key created ✅
- [ ] Token generator configured ✅
- [ ] Token generated successfully ✅
- [ ] App updated with token ✅
- [ ] Apple Maps loading in browser ✅

---

**Ready to go!** Your Apple Maps integration should now be working perfectly! 🎉


