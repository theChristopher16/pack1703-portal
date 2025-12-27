# 👥 Team Setup Guide - Copse iOS App

This guide helps team members set up the iOS project for development and collaboration.

## 📋 Prerequisites

- **macOS**: Ventura (13.0) or later
- **Xcode**: 15.0 or later (download from Mac App Store)
- **Apple Developer Account**: Required for device testing and TestFlight
- **Git**: Already installed with Xcode

## 🚀 Initial Setup (First Time)

### 1. Clone the Repository

```bash
git clone https://github.com/theChristopher16/pack1703-portal.git
cd pack1703-portal/ios/Copse
```

### 2. Open Project in Xcode

```bash
open Copse.xcodeproj
```

**Important**: Use `.xcodeproj`, NOT `.xcworkspace` (we use Swift Package Manager, not CocoaPods)

### 3. Configure Signing & Capabilities

1. In Xcode, select the **Copse** project in the navigator (top item)
2. Select the **Copse** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** from the dropdown
   - If you don't see your team, you may need to:
     - Sign in to Xcode: Xcode → Settings → Accounts → Add Apple ID
     - Accept the Apple Developer Agreement
6. Xcode will automatically create provisioning profiles

### 4. Add Firebase Configuration

**⚠️ IMPORTANT**: `GoogleService-Info.plist` is NOT in git (contains sensitive keys)

1. Get the file from a team member or Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select project: **pack1703-portal**
   - Settings → Project settings → Your apps → iOS app
   - Download `GoogleService-Info.plist`
2. Add to project:
   - Drag `GoogleService-Info.plist` into `Copse/Config/` folder in Xcode
   - ✅ Check **"Copy items if needed"**
   - ✅ Select **Copse** target
   - Click **Finish**

### 5. Resolve Swift Package Dependencies

Xcode should automatically resolve packages, but if not:

1. File → Packages → Resolve Package Versions
2. Wait for packages to download (Firebase, StreamChat, GoogleSignIn)
3. This may take 2-3 minutes on first setup

### 6. Build the Project

1. Select a simulator (e.g., "iPhone 17 Pro") from the device dropdown
2. Press `Cmd + B` to build
3. If build succeeds, you're ready! ✅

## 🔄 Daily Workflow

### Pull Latest Changes

```bash
git pull origin main
```

If Xcode is open:
1. Xcode will detect file changes
2. If packages changed: File → Packages → Update to Latest Package Versions
3. Clean build folder: `Cmd + Shift + K`
4. Build: `Cmd + B`

### Run on Simulator

1. Select simulator from device dropdown
2. Press `Cmd + R` (or click Play button)
3. App launches in simulator

### Run on Physical Device

1. Connect iPhone/iPad via USB
2. Trust computer on device (if first time)
3. Select your device from device dropdown
4. Press `Cmd + R`
5. First time: On device, go to Settings → General → VPN & Device Management → Trust developer

## 🧪 Testing Checklist

Before committing:
- [ ] App builds without errors
- [ ] App runs on simulator
- [ ] Login screen appears
- [ ] Can sign up with email/password
- [ ] Can sign in with existing account

## 🐛 Common Issues

### "No such module 'Firebase'"
**Fix**: 
1. File → Packages → Reset Package Caches
2. File → Packages → Resolve Package Versions
3. Clean build: `Cmd + Shift + K`
4. Build: `Cmd + B`

### "GoogleService-Info.plist not found"
**Fix**: See step 4 above - you need to add this file manually

### Signing errors
**Fix**: 
1. Go to Signing & Capabilities
2. Select your Team
3. Ensure "Automatically manage signing" is checked

### "Scheme Copse is not configured"
**Fix**: 
1. Product → Scheme → Manage Schemes
2. Ensure "Copse" scheme is checked and "Shared"
3. Click "Close"

## 📦 Project Structure

```
Copse/
├── App/
│   └── CopseApp.swift          # App entry point
├── Views/
│   ├── LoginView.swift         # Login screen
│   └── ...                     # Other views
├── Services/
│   ├── FirebaseService.swift   # Firebase integration
│   └── ...                     # Other services
├── Models/
│   └── ...                     # Data models
└── Config/
    └── GoogleService-Info.plist  # Firebase config (not in git)
```

## 🔐 Security Notes

- **Never commit** `GoogleService-Info.plist` to git
- **Never commit** personal signing certificates
- All sensitive config is in `.gitignore`

## 📚 Additional Resources

- [Firebase iOS Setup](FIREBASE_IOS_SETUP.md)
- [Quick Start Guide](QUICKSTART.md)
- [TestFlight Setup](TESTFLIGHT_SETUP.md)


