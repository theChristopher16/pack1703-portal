# 🍎 Pack 1703 Portal - iOS App (Copse)

Native iOS application for Pack 1703 Portal built with Swift and SwiftUI.

## 📋 Requirements

- **Xcode**: 15.0 or later
- **iOS**: 16.0 or later
- **macOS**: Ventura or later
- **Apple Developer Account**: Required for device testing and App Store distribution

## 🚀 Getting Started

### 1. Install Xcode

Download Xcode from the Mac App Store or Apple Developer website.

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `pack1703-portal`
3. Click **"Add app"** → Select **iOS** (🍎)
4. Enter Bundle ID: `com.pack1703.copse`
5. Download `GoogleService-Info.plist`
6. Copy it to: `ios/Copse/Config/GoogleService-Info.plist`

### 3. Open Project in Xcode

```bash
cd ios
open Copse.xcodeproj
```

Or create the Xcode project:

```bash
# If you don't have an .xcodeproj yet, you can create one in Xcode:
# File → New → Project → iOS → App
# - Product Name: Copse
# - Bundle Identifier: com.pack1703.copse
# - Interface: SwiftUI
# - Language: Swift
# - Storage: None
```

### 4. Add Firebase iOS SDK

The project uses **Swift Package Manager** for dependencies.

In Xcode:
1. File → Add Package Dependencies
2. Enter: `https://github.com/firebase/firebase-ios-sdk.git`
3. Select version: `10.20.0` or later
4. Add these packages:
   - FirebaseAuth
   - FirebaseFirestore
   - FirebaseStorage
   - FirebaseFunctions
   - FirebaseMessaging

### 5. Configure Signing

1. In Xcode, select the project
2. Select the "Copse" target
3. Go to "Signing & Capabilities"
4. Select your Team
5. Ensure "Automatically manage signing" is checked

### 6. Run the App

1. Select a simulator or connected device
2. Press `Cmd + R` or click the "Run" button
3. The app should build and launch

## 📁 Project Structure

```
ios/
├── Copse/
│   ├── App/                    # App entry point
│   │   └── CopseApp.swift      # Main app configuration
│   ├── Views/                  # SwiftUI views
│   │   ├── ContentView.swift   # Root view
│   │   └── LoginView.swift     # Authentication
│   ├── Models/                 # Data models
│   │   ├── Event.swift         # Event model
│   │   ├── Message.swift       # Chat message model
│   │   └── UserProfile.swift   # User model
│   ├── Services/               # Business logic
│   │   └── FirebaseService.swift
│   ├── Config/                 # Configuration files
│   │   ├── Info.plist
│   │   └── GoogleService-Info.plist
│   └── Resources/              # Assets and resources
├── Package.swift               # Swift Package Manager
└── README.md                   # This file
```

## 🔧 Development

### Building for Debug

```bash
xcodebuild -scheme Copse -configuration Debug
```

### Building for Release

```bash
xcodebuild -scheme Copse -configuration Release
```

### Running Tests

```bash
xcodebuild test -scheme Copse -destination 'platform=iOS Simulator,name=iPhone 15'
```

## 🔐 Security Configuration

### Update `.gitignore`

Add these lines to your root `.gitignore`:

```gitignore
# iOS Firebase Configuration
ios/Copse/Config/GoogleService-Info.plist

# Xcode
ios/**/*.xcodeproj/xcuserdata/
ios/**/*.xcodeproj/project.xcworkspace/xcuserdata/
ios/**/*.xcworkspace/xcuserdata/
ios/**/DerivedData/
ios/**/.DS_Store

# CocoaPods (if used)
ios/Pods/
ios/**/*.xcworkspace/
ios/Podfile.lock
```

## 🎯 Features

### Implemented
- ✅ Basic app structure
- ✅ SwiftUI views (Login, Home, Loading)
- ✅ Firebase integration setup
- ✅ Data models (Event, Message, UserProfile)
- ✅ Authentication flow

### To Be Implemented
- ⏳ Firebase Authentication (Email/Password)
- ⏳ Google Sign-In
- ⏳ Apple Sign-In
- ⏳ Event listing and details
- ⏳ Chat functionality
- ⏳ Calendar view
- ⏳ Push notifications
- ⏳ Offline support
- ⏳ Photo upload
- ⏳ Location services

## 🔗 Shared Firebase Backend

This iOS app shares the same Firebase backend as the web app:
- **Firestore Database**: Same collections and documents
- **Cloud Functions**: Same serverless functions
- **Storage**: Same file storage
- **Authentication**: Same user accounts
- **AI Agents**: Can interact with Solyn and Nova

## 📱 Testing

### Simulator Testing
- Run on iOS Simulator (no Apple Developer account required)
- Test basic functionality and UI

### Device Testing
- Requires Apple Developer account
- Connect iPhone/iPad via USB or wirelessly
- Select device in Xcode and run

### TestFlight Distribution
- Build archive: Product → Archive
- Upload to App Store Connect
- Add internal/external testers
- Distribute via TestFlight

## 🚢 Deployment

### App Store Submission
1. Build release version
2. Archive the app
3. Upload to App Store Connect
4. Complete App Store information
5. Submit for review

### Version Management
- Update `CFBundleShortVersionString` in Info.plist
- Update `CFBundleVersion` for each build
- Follow semantic versioning: `MAJOR.MINOR.PATCH`

## 🆘 Troubleshooting

### Build Errors

**"No such module 'Firebase'"**
- Ensure Firebase SDK is added via SPM
- Clean build folder: `Cmd + Shift + K`
- Rebuild: `Cmd + B`

**"GoogleService-Info.plist not found"**
- Download from Firebase Console
- Add to `ios/Copse/Config/` directory
- Add to Xcode project

**Signing Issues**
- Select your Team in Signing & Capabilities
- Check Bundle Identifier matches: `com.pack1703.copse`

### Runtime Issues

**Firebase not configured**
- Ensure `FirebaseApp.configure()` is called in `CopseApp.init()`
- Check GoogleService-Info.plist is in app bundle

**Authentication fails**
- Enable Email/Password auth in Firebase Console
- Enable Google Sign-In in Firebase Console
- Add OAuth redirect URIs

## 📚 Resources

- [Firebase iOS Documentation](https://firebase.google.com/docs/ios/setup)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## 👥 Team

Built for Pack 1703 by the Pack 1703 Portal team.

For questions or support, contact your den leader or pack administrator.

---

**Version**: 1.0.0  
**Last Updated**: November 2025

