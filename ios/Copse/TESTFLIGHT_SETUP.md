# 🚀 TestFlight Setup Guide

Step-by-step guide to deploy Copse to TestFlight for team testing.

## 📋 Prerequisites

- **Apple Developer Account** (paid, $99/year)
- **App Store Connect** access
- **Xcode** 15.0 or later
- **Valid signing certificate** (Xcode will create automatically)

## 🎯 Step 1: App Store Connect Setup

### 1.1 Create App Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Copse (or Pack 1703 Portal)
   - **Primary Language**: English
   - **Bundle ID**: `com.copse.Copse` (must match Xcode project)
   - **SKU**: `copse-ios` (unique identifier, can be anything)
   - **User Access**: Full Access
4. Click **"Create"**

### 1.2 Complete App Information

1. In App Store Connect, go to your app
2. Fill in required information:
   - **Privacy Policy URL**: (required for TestFlight)
   - **Category**: Education or Lifestyle
   - **Age Rating**: Complete the questionnaire
   - **App Icon**: 1024x1024 PNG (optional for TestFlight)
   - **Screenshots**: Optional for TestFlight

## 🔧 Step 2: Configure Xcode Project

### 2.1 Update Version Numbers

1. Open `Copse.xcodeproj` in Xcode
2. Select **Copse** project → **Copse** target
3. Go to **General** tab
4. Update:
   - **Version**: `1.0` (user-facing version)
   - **Build**: `1` (increment for each TestFlight build)

### 2.2 Configure Signing

1. Go to **Signing & Capabilities** tab
2. Ensure:
   - ✅ **"Automatically manage signing"** is checked
   - **Team**: Your Apple Developer team is selected
   - **Bundle Identifier**: `com.copse.Copse`
   - **Provisioning Profile**: Should be auto-generated

### 2.3 Set Build Configuration

1. Go to **Product** → **Scheme** → **Edit Scheme**
2. Select **Archive** from left sidebar
3. Set **Build Configuration** to **Release**
4. Click **Close**

## 📦 Step 3: Create Archive

### 3.1 Clean Build

1. Product → Clean Build Folder (`Cmd + Shift + K`)
2. Wait for clean to complete

### 3.2 Create Archive

1. Select **"Any iOS Device"** from device dropdown (NOT a simulator)
2. Product → Archive (`Cmd + B` then wait, or Product → Archive)
3. Wait for archive to build (5-10 minutes)
4. Organizer window opens automatically

## 📤 Step 4: Upload to App Store Connect

### 4.1 Validate Archive

1. In Organizer, select your archive
2. Click **"Validate App"**
3. Click **"Next"**
4. Select **"Automatically manage signing"**
5. Click **"Validate"**
6. Wait for validation (checks for common issues)
7. If validation passes, proceed to upload

### 4.2 Distribute App

1. In Organizer, select your archive
2. Click **"Distribute App"**
3. Select **"App Store Connect"**
4. Click **"Next"**
5. Select **"Upload"**
6. Click **"Next"**
7. Select **"Automatically manage signing"**
8. Click **"Next"**
9. Review summary
10. Click **"Upload"**
11. Wait for upload (5-15 minutes depending on size)

## ✅ Step 5: Process Build in App Store Connect

### 5.1 Wait for Processing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **TestFlight** tab
4. Wait for build to appear (10-30 minutes)
5. Build status will show "Processing" → "Ready to Test"

### 5.2 Add Test Information (Optional)

1. Click on your build
2. Add **"What to Test"** notes:
   ```
   - Test login with email/password
   - Test event viewing
   - Test RSVP functionality
   - Test chat features
   ```

## 👥 Step 6: Add Testers

### 6.1 Internal Testing (Up to 100 testers)

1. Go to **TestFlight** tab
2. Click **"Internal Testing"**
3. Click **"+"** to create group (e.g., "Pack 1703 Team")
4. Add testers:
   - Enter Apple ID emails
   - Or add from your team members
5. Select your build
6. Click **"Start Testing"**
7. Testers receive email invitation

### 6.2 External Testing (Up to 10,000 testers)

1. Go to **TestFlight** tab
2. Click **"External Testing"**
3. Click **"+"** to create group
4. Add testers (same as above)
5. **Important**: First external test requires App Review (24-48 hours)
6. After approval, testers can install immediately

## 📱 Step 7: Install TestFlight App

Testers need to:

1. Install **TestFlight** app from App Store (if not already installed)
2. Open email invitation
3. Tap **"View in TestFlight"** or **"Start Testing"**
4. App installs automatically
5. Open app and test!

## 🔄 Step 8: Update Builds

For each new version:

1. Update **Build** number in Xcode (increment by 1)
2. Create new archive
3. Upload to App Store Connect
4. Wait for processing
5. Testers automatically get update notification

## 📊 Step 9: Monitor Feedback

1. In App Store Connect → TestFlight
2. View **"Feedback"** from testers
3. View **"Crashes"** and **"Metrics"**
4. Use feedback to improve app

## 🐛 Troubleshooting

### "No accounts with App Store Connect access"
**Fix**: 
- Sign in to App Store Connect with Apple ID
- Ensure you're added to the team in App Store Connect

### "Invalid Bundle Identifier"
**Fix**: 
- Bundle ID in Xcode must match App Store Connect exactly
- Check: `com.copse.Copse` (case-sensitive)

### "Missing Compliance"
**Fix**: 
- In App Store Connect → TestFlight → Your Build
- Answer export compliance questions
- Usually: "No" to encryption questions (unless using custom encryption)

### "Build Processing Failed"
**Fix**: 
- Check email from Apple for specific error
- Common issues:
  - Missing privacy descriptions in Info.plist
  - Invalid icon format
  - Code signing issues

### Archive button is grayed out
**Fix**: 
- Select "Any iOS Device" (not simulator)
- Clean build folder first
- Ensure signing is configured

## 📝 Version Numbering

Follow semantic versioning:
- **Version** (CFBundleShortVersionString): `1.0`, `1.1`, `2.0`
- **Build** (CFBundleVersion): `1`, `2`, `3`, ... (always increment)

Example:
- Version 1.0, Build 1 (first TestFlight)
- Version 1.0, Build 2 (bug fix)
- Version 1.1, Build 3 (new features)

## 🔐 Security Checklist

Before uploading:
- [ ] No hardcoded API keys in code
- [ ] GoogleService-Info.plist not committed to git
- [ ] All sensitive data in environment variables or secure storage
- [ ] Privacy policy URL is valid
- [ ] All required privacy descriptions in Info.plist

## 📚 Additional Resources

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)


