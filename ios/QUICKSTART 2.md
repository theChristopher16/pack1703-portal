# 🚀 iOS Quick Start Guide

Get your Pack 1703 Portal iOS app up and running in minutes!

## ⚡ Prerequisites

- ✅ macOS Ventura or later
- ✅ Xcode 15.0+ (from Mac App Store)
- ✅ Apple ID (free or paid developer account)

## 🏃‍♂️ Quick Start (5 Steps)

### Step 1: Open Xcode (2 min)
```bash
# Open Xcode from Applications or:
open -a Xcode
```

### Step 2: Create New Project (3 min)

In Xcode:
1. **File → New → Project**
2. Select **iOS → App**
3. Click **Next**
4. Fill in:
   - **Product Name**: `Copse`
   - **Team**: Select your Apple ID
   - **Organization Identifier**: `com.pack1703`
   - **Bundle Identifier**: `com.pack1703.copse` (auto-filled)
   - **Interface**: **SwiftUI**
   - **Language**: **Swift**
   - **Storage**: **None**
5. Click **Next**
6. **Save in**: `/Users/christophersmith/Documents/GitHub/pack1703-portal/ios/`
7. **Uncheck** "Create Git repository"
8. Click **Create**

### Step 3: Add Existing Files (5 min)

In Xcode Project Navigator:

1. **Delete** the default files:
   - `CopseApp.swift` (default one)
   - `ContentView.swift` (default one)
   - `Assets.xcassets` (keep this!)

2. **Add our files**:
   - Right-click on `Copse` folder
   - Select **"Add Files to Copse..."**
   - Navigate to `ios/Copse/`
   - Select all folders: `App`, `Views`, `Models`, `Services`, `Config`
   - ✅ Check **"Copy items if needed"**
   - ✅ Check **"Create groups"**
   - ✅ Ensure **Copse** target is checked
   - Click **Add**

### Step 4: Add Firebase SDK (5 min)

1. **File → Add Package Dependencies**
2. Paste: `https://github.com/firebase/firebase-ios-sdk.git`
3. Click **Add Package**
4. Select version: **10.20.0** (or "Up to Next Major Version")
5. Click **Add Package**
6. Select these packages:
   - ✅ FirebaseAuth
   - ✅ FirebaseFirestore
   - ✅ FirebaseStorage
   - ✅ FirebaseFunctions
   - ✅ FirebaseMessaging
7. Click **Add Package**

### Step 5: Get Firebase Config (5 min)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open project: **pack1703-portal**
3. Click ⚙️ **Settings** → **Project settings**
4. Scroll to **Your apps**
5. Click **Add app** → **iOS** (🍎)
6. Enter Bundle ID: `com.pack1703.copse`
7. Click **Register app**
8. **Download** `GoogleService-Info.plist`
9. In Xcode:
   - Drag `GoogleService-Info.plist` into `Copse/Config/` folder
   - ✅ Check **"Copy items if needed"**
   - ✅ Select **Copse** target
   - Click **Finish**

## 🎉 Run the App!

1. Select **iPhone 15** simulator (or any device)
2. Press **Cmd + R** (or click ▶️ Run button)
3. Wait for build to complete
4. App launches! 🚀

## ✅ What You Should See

1. **Loading screen** with Pack 1703 logo (🌲)
2. **Login screen** with:
   - Email/password fields
   - Sign In button
   - Google Sign-In option
   - Apple Sign-In option
   - Pack 1703 branding

## 🐛 Common Issues

### "GoogleService-Info.plist not found"
**Fix**: Ensure the file is added to Copse target
1. Select `GoogleService-Info.plist` in navigator
2. Check **Target Membership** → ✅ Copse

### "No such module 'Firebase'"
**Fix**: Clean and rebuild
1. Press **Cmd + Shift + K** (Clean)
2. Press **Cmd + B** (Build)

### Signing error
**Fix**: Select your team
1. Select project in navigator
2. Select **Copse** target
3. Go to **Signing & Capabilities**
4. Select your **Team**

### Build fails
**Fix**: Check deployment target
1. Select project → Copse target
2. Go to **General**
3. Set **Minimum Deployments** to **iOS 16.0**

## 📱 Test on Real Device

1. Connect iPhone/iPad via USB
2. Trust computer on device
3. In Xcode, select your device
4. Press Cmd + R
5. First time: **Trust developer** on device
6. App launches! 🎉

## 🔐 Enable Sign-In Methods

### Email/Password
Already enabled! ✅

### Google Sign-In
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google** → **Enable**
3. Add iOS URL scheme to `Info.plist` (see `FIREBASE_IOS_SETUP.md`)

### Apple Sign-In
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Apple** → **Enable**
3. In Xcode:
   - Select project → Copse target
   - Go to **Signing & Capabilities**
   - Click **+ Capability**
   - Add **Sign in with Apple**

## 📚 Next Steps

Once the app runs:

1. ✅ Test login flow
2. ✅ Verify Firebase connection
3. 🔨 Implement authentication
4. 🔨 Add event listing
5. 🔨 Add chat functionality
6. 🔨 Set up push notifications
7. 🚀 Deploy to TestFlight

## 💡 Pro Tips

### Faster Build Times
- Use simulator instead of device for development
- Keep Xcode closed when not in use
- Clean build folder weekly

### Better Development
- Use SwiftUI Previews (Cmd + Option + Return)
- Enable console for Firebase logs
- Use breakpoints for debugging

### Before Production
- Test on multiple devices (iPhone, iPad)
- Test on different iOS versions (16, 17, 18)
- Enable App Check for security
- Set up push notification certificates

## 🆘 Need Help?

1. **Check logs**: Xcode → **View → Debug Area → Show Console**
2. **Review docs**: `ios/README.md` for detailed info
3. **Firebase setup**: `ios/FIREBASE_IOS_SETUP.md`
4. **Contact**: Your pack administrator

## 🎯 Expected Timeline

- **Setup**: 20 minutes (first time)
- **Basic features**: 2-4 weeks
- **Full feature parity**: 2-3 months
- **Production ready**: 3-4 months

## ✨ You're All Set!

Your iOS app is now running with:
- ✅ Modern SwiftUI interface
- ✅ Firebase backend integration
- ✅ Pack 1703 branding
- ✅ Authentication UI ready
- ✅ Shared data with web app

**Happy coding!** 🎉

---

**Questions?** Check `ios/README.md` or `ios/FIREBASE_IOS_SETUP.md`

