# Firebase Social Login Setup Guide

## 🔧 Fix for "auth/operation-not-allowed" Error

The error you're seeing means the social login providers aren't enabled in your Firebase project. Follow these steps:

### 1. Enable Apple Sign-In

1. **Go to Firebase Console**: https://console.firebase.google.com/project/pack-1703-portal/overview
2. **Navigate to Authentication**: Click "Authentication" in the left sidebar
3. **Go to Sign-in method**: Click the "Sign-in method" tab
4. **Find Apple**: Look for "Apple" in the list of providers
5. **Enable Apple**:
   - Click on "Apple"
   - Toggle "Enable" to ON
   - **Service ID**: Enter your Apple Service ID (e.g., `com.sfpack1703.portal`)
   - **Apple Team ID**: Enter your Apple Developer Team ID
   - **Key ID**: Enter your Apple Key ID
   - **Private Key**: Upload your Apple private key file
   - **Save**

### 2. Enable Google Sign-In

1. **In the same Sign-in method page**:
2. **Find Google**: Look for "Google" in the list
3. **Enable Google**:
   - Click on "Google"
   - Toggle "Enable" to ON
   - **Project support email**: Enter your email
   - **Save**

### 3. Enable Other Providers (Optional)

You can also enable:
- **Facebook**: Requires Facebook App setup
- **GitHub**: Requires GitHub OAuth App
- **Twitter**: Requires Twitter App

### 4. Add Authorized Domains

1. **In Authentication settings**:
2. **Go to "Settings" tab**
3. **Add authorized domain**: `pack-1703-portal.web.app`
4. **Add your custom domain** if you have one

### 5. Apple Developer Account Setup (for Apple Sign-In)

If you don't have Apple Sign-In configured:

1. **Go to Apple Developer**: https://developer.apple.com
2. **Create App ID**: Create a new App ID for your web app
3. **Enable Sign In with Apple**: In the App ID settings
4. **Create Service ID**: Create a service ID for your web domain
5. **Create Private Key**: Generate a private key for authentication
6. **Configure domains**: Add your web domain to the service ID

## 🚀 Quick Test

After enabling the providers:

1. **Deploy the app**: `firebase deploy --only hosting`
2. **Test social login**: Try signing in with Apple/Google
3. **Check console**: No more "auth/operation-not-allowed" errors

## 📞 Need Help?

If you need help with Apple Developer setup or other providers, let me know and I can provide more detailed instructions for each specific provider.
