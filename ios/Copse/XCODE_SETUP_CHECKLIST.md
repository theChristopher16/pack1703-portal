# ✅ Xcode Setup Checklist

Complete these steps in Xcode to make the project ready for team collaboration and TestFlight.

## 🔧 Step 1: Share the Scheme (Required for Team)

1. Open `Copse.xcodeproj` in Xcode
2. Go to **Product** → **Scheme** → **Manage Schemes...**
3. Find **"Copse"** scheme in the list
4. ✅ Check the **"Shared"** checkbox next to it
5. Click **"Close"**

**Why**: This ensures all team members can build and run the project without creating their own schemes.

## 🔐 Step 2: Configure Signing (Each Team Member)

1. Select **Copse** project in navigator (top item)
2. Select **Copse** target
3. Go to **Signing & Capabilities** tab
4. ✅ Check **"Automatically manage signing"**
5. Select your **Team** from dropdown
   - If you don't see your team:
     - Xcode → Settings (Preferences) → Accounts
     - Click **"+"** → Add Apple ID
     - Sign in with your Apple Developer account
     - Accept any agreements
     - Return to Signing & Capabilities and select team

**Note**: Each developer can have their own team selected. Xcode will create individual provisioning profiles.

## 📦 Step 3: Verify Package Dependencies

1. Go to **File** → **Packages** → **Resolve Package Versions**
2. Wait for packages to download (Firebase, StreamChat, GoogleSignIn)
3. Verify in Project Navigator that packages appear under "Package Dependencies"

**If packages don't resolve**:
- File → Packages → Reset Package Caches
- File → Packages → Resolve Package Versions

## 🎯 Step 4: Set Build Configuration for Archive

1. **Product** → **Scheme** → **Edit Scheme...**
2. Select **Archive** from left sidebar
3. Set **Build Configuration** to **Release**
4. Click **Close**

**Why**: TestFlight requires Release builds.

## 📱 Step 5: Verify Bundle Identifier

1. Select **Copse** target
2. Go to **General** tab
3. Verify **Bundle Identifier**: `com.copse.Copse`
4. This must match your App Store Connect app record

## 🔢 Step 6: Set Version Numbers

1. In **General** tab:
   - **Version**: `1.0` (user-facing version)
   - **Build**: `1` (increment for each TestFlight build)

## 📄 Step 7: Add GoogleService-Info.plist (Each Team Member)

**⚠️ This file is NOT in git (contains sensitive keys)**

1. Get the file from:
   - Team lead, OR
   - Firebase Console → Project Settings → Your apps → iOS app → Download
2. In Xcode:
   - Drag `GoogleService-Info.plist` into `Copse/Config/` folder
   - ✅ Check **"Copy items if needed"**
   - ✅ Select **Copse** target
   - Click **Finish**

## ✅ Step 8: Test Build

1. Select **"Any iOS Device"** from device dropdown
2. Press `Cmd + B` to build
3. If build succeeds, you're ready! ✅

## 🚀 Step 9: Test Archive (For TestFlight)

1. Select **"Any iOS Device"**
2. **Product** → **Archive**
3. Wait for archive to complete (5-10 minutes)
4. Organizer window opens
5. You can validate or distribute from here

## 📋 Quick Verification

After completing all steps, verify:

- [ ] Scheme is shared (Product → Scheme → Manage Schemes → Copse is checked as Shared)
- [ ] Signing is configured (Team selected, automatic signing enabled)
- [ ] Packages are resolved (no errors in Project Navigator)
- [ ] Archive uses Release configuration
- [ ] Bundle ID is `com.copse.Copse`
- [ ] Version numbers are set
- [ ] GoogleService-Info.plist is added (each team member)
- [ ] Project builds successfully

## 🐛 Common Issues

### "Scheme Copse is not configured"
**Fix**: Complete Step 1 above (share the scheme)

### "No accounts with App Store Connect access"
**Fix**: 
- Sign in to Xcode → Settings → Accounts
- Add your Apple ID
- Accept developer agreements

### Packages won't resolve
**Fix**:
- File → Packages → Reset Package Caches
- File → Packages → Resolve Package Versions
- Restart Xcode if needed

### Archive button is grayed out
**Fix**:
- Select "Any iOS Device" (not a simulator)
- Ensure signing is configured
- Clean build folder: `Cmd + Shift + K`

## 📚 Next Steps

- **For Team Members**: See [TEAM_SETUP.md](TEAM_SETUP.md)
- **For TestFlight**: See [TESTFLIGHT_SETUP.md](TESTFLIGHT_SETUP.md)
- **Quick Reference**: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)


