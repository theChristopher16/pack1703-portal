# 🔥 Firebase iOS Setup Guide

Step-by-step instructions for adding iOS app to your existing Firebase project.

## Prerequisites

- Firebase project already configured (pack1703-portal)
- Apple Developer Account (for device testing, optional for simulator)
- Xcode 15.0 or later

## Step 1: Add iOS App to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **pack1703-portal**
3. Click the **Settings** gear icon → **Project settings**
4. Scroll down to "Your apps" section
5. Click **"Add app"** → Select **iOS** (🍎)

## Step 2: Register iOS App

Enter the following details:

- **iOS bundle ID**: `com.pack1703.copse`
  - ⚠️ This must match exactly with your Xcode project
  - This cannot be changed later!

- **App nickname** (optional): `Copse iOS`

- **App Store ID** (optional): Leave blank for now

Click **"Register app"**

## Step 3: Download Configuration File

1. Click **"Download GoogleService-Info.plist"**
2. Save the file to your computer
3. **Important**: Do NOT rename this file

## Step 4: Add Configuration to Project

### Option A: Using Terminal

```bash
cd /Users/christophersmith/Documents/GitHub/pack1703-portal
cp ~/Downloads/GoogleService-Info.plist ios/Copse/Config/
```

### Option B: Using Finder

1. Open Finder
2. Navigate to `Downloads` folder
3. Copy `GoogleService-Info.plist`
4. Paste into: `ios/Copse/Config/`

### Option C: In Xcode (when project is created)

1. Open Xcode project
2. Right-click on `Copse/Config` folder
3. Select "Add Files to Copse..."
4. Select `GoogleService-Info.plist`
5. Ensure "Copy items if needed" is checked
6. Click "Add"

## Step 5: Verify File Location

Ensure the file is at:
```
ios/Copse/Config/GoogleService-Info.plist
```

The file should contain your project-specific configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
    <key>API_KEY</key>
    <string>AIza...</string>
    <key>PROJECT_ID</key>
    <string>pack1703-portal</string>
    <!-- ... more config ... -->
</dict>
</plist>
```

## Step 6: Enable Firebase Services

In Firebase Console, enable the following services for iOS:

### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** (should already be enabled)
3. Enable **Google** Sign-In
   - Add iOS URL scheme: `com.googleusercontent.apps.YOUR-CLIENT-ID`
4. Enable **Apple** Sign-In (recommended for iOS)

### Cloud Firestore
- Already configured from web app
- iOS uses the same database

### Cloud Storage
- Already configured from web app
- iOS uses the same storage bucket

### Cloud Functions
- Already configured from web app
- iOS can call the same functions

### Cloud Messaging (Push Notifications)
1. Go to **Cloud Messaging**
2. Click **"Upload"** under Apple Push Notification service (APNs)
3. Upload your APNs key (.p8 file)
   - Get this from Apple Developer portal
   - Certificates, Identifiers & Profiles → Keys

## Step 7: Configure App Capabilities in Xcode

When you create/open the Xcode project:

1. Select project in navigator
2. Select "Copse" target
3. Go to "Signing & Capabilities" tab
4. Add these capabilities:
   - ✅ Push Notifications
   - ✅ Background Modes → Remote notifications
   - ✅ Sign in with Apple
   - ✅ Access WiFi Information (optional)

## Step 8: Update Info.plist for OAuth

Your `Info.plist` already includes basic setup. For Google Sign-In, add:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.pack1703.copse</string>
            <!-- Add Google URL scheme from GoogleService-Info.plist -->
            <string>com.googleusercontent.apps.YOUR-CLIENT-ID-HERE</string>
        </array>
    </dict>
</array>
```

## Step 9: Test Firebase Connection

In Xcode:

1. Build and run the app (Cmd+R)
2. Check console for: "Firebase initialized successfully"
3. If you see errors, check:
   - GoogleService-Info.plist is included in app target
   - Bundle ID matches: `com.pack1703.copse`
   - File is in correct location

## Step 10: Security Configuration

### Update Firestore Rules (if needed)

Your existing Firestore rules should work for iOS. Ensure they allow authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Enable App Check (Recommended)

1. Go to **Firebase Console** → **App Check**
2. Click **"Register"** for iOS app
3. Select **"DeviceCheck"** for production
4. Select **"App Attest"** for best security (iOS 14+)

In your iOS app, add App Check:

```swift
import FirebaseAppCheck

// In CopseApp.init()
let providerFactory = AppCheckDebugProviderFactory()
AppCheck.setAppCheckProviderFactory(providerFactory)
```

## Verification Checklist

✅ iOS app added to Firebase Console  
✅ GoogleService-Info.plist downloaded  
✅ Config file placed in `ios/Copse/Config/`  
✅ Firebase Authentication enabled  
✅ Google Sign-In configured  
✅ Apple Sign-In configured  
✅ Push notifications set up  
✅ App builds successfully  
✅ Firebase initializes without errors  
✅ File not committed to git (in .gitignore)  

## Troubleshooting

### Error: "GoogleService-Info.plist not found"
- Check file location: `ios/Copse/Config/GoogleService-Info.plist`
- Ensure file is added to Xcode target
- Clean build folder (Cmd+Shift+K) and rebuild

### Error: "Invalid configuration"
- Verify Bundle ID matches: `com.pack1703.copse`
- Check API_KEY in GoogleService-Info.plist is not empty
- Ensure file is valid XML (open in text editor)

### Error: "Firebase App named '__FIRAPP_DEFAULT' already exists"
- Ensure `FirebaseApp.configure()` is only called once
- Check it's in `CopseApp.init()`, not elsewhere

### Google Sign-In fails
- Add Google URL scheme to Info.plist
- Enable Google Sign-In in Firebase Console
- Add OAuth 2.0 Client ID for iOS

### Apple Sign-In fails
- Enable Apple Sign-In in Firebase Console
- Add "Sign in with Apple" capability in Xcode
- Verify Bundle ID in Apple Developer portal

## Next Steps

After setup:
1. Test authentication flows
2. Implement event listing
3. Add chat functionality
4. Test push notifications
5. Deploy to TestFlight

## Resources

- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Firebase Authentication](https://firebase.google.com/docs/auth/ios/start)
- [Google Sign-In for iOS](https://firebase.google.com/docs/auth/ios/google-signin)
- [Apple Sign-In](https://firebase.google.com/docs/auth/ios/apple)
- [Push Notifications](https://firebase.google.com/docs/cloud-messaging/ios/client)

---

**Need Help?**  
Contact your pack administrator or check the main README.md for support.

