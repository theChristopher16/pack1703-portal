# 🔧 Fix Copse Build Errors

## Quick Fix Guide

You're seeing XCTest linking errors because test frameworks are being linked to the main app target. Here's how to fix it:

---

## ✅ Automated Fixes Applied

I've already fixed:
- ✅ Deprecated `onChange` API calls → Updated to iOS 17+ syntax
- ✅ Async/await semaphore issue → Fixed with continuation
- ✅ Cleaned build artifacts

---

## 🔨 Manual Fix Required in Xcode

### Step 1: Clean Build Folder
```
In Xcode menu:
Product → Clean Build Folder
(or press: Cmd+Shift+K)
```

### Step 2: Remove XCTest Frameworks

1. **Select Target**
   - Left sidebar → Click "Copse" (blue icon)
   - In main area, select **"Copse"** under TARGETS (not PROJECT)

2. **Go to Build Phases**
   - Click the **"Build Phases"** tab at the top

3. **Expand "Link Binary With Libraries"**
   - Click the disclosure triangle to expand this section

4. **Remove XCTest Frameworks**
   - Look for any of these frameworks:
     - `XCTest.framework`
     - `XCTestSwiftSupport`
     - `XCUIAutomation.framework`
     - Any other framework with "Test" in the name
   - Select each one and click the **"-"** button to remove

### Step 3: Disable Testing Search Paths

1. **Go to Build Settings**
   - Click the **"Build Settings"** tab

2. **Search for Testing**
   - In the search box, type: `ENABLE_TESTING_SEARCH_PATHS`

3. **Set to No**
   - Find the setting
   - Change both **Debug** and **Release** to **"No"**

### Step 4: Build Again
```
Press Cmd+B to build
```

---

## 🎯 Visual Guide

### Where to Find Build Phases:

```
Xcode Window
├── Left Sidebar
│   └── Copse (blue project icon) ← Click this
│
└── Main Area
    ├── PROJECT (Copse)
    └── TARGETS
        └── Copse ← Select this
            ├── General
            ├── Signing & Capabilities
            ├── Resource Tags
            ├── Info
            ├── Build Settings ← Check here for ENABLE_TESTING_SEARCH_PATHS
            ├── Build Phases ← Check here for XCTest frameworks
            ├── Build Rules
            └── Package Dependencies
```

### What You're Looking For in Build Phases:

```
▾ Link Binary With Libraries (17 items)
  ├── SwiftUI.framework
  ├── FirebaseAuth (package)
  ├── GoogleSignIn (package)
  ├── XCTest.framework ← ❌ REMOVE THIS IF PRESENT
  ├── XCTestSwiftSupport ← ❌ REMOVE THIS IF PRESENT
  └── ... other frameworks
```

---

## 🐛 If Still Getting Errors

### Error: "Cannot find XCTest in scope"
**Cause**: Test code is in main target
**Fix**: Look for any files with "Test" in the name and remove them from the Copse target

### Error: "SwiftUICore cannot link"
**Cause**: iOS version mismatch
**Fix**: 
1. Select Copse target
2. General tab
3. Set "Minimum Deployments" to **iOS 15.0** or higher

### Error: "Build input file cannot be found"
**Cause**: Missing files or stale references
**Fix**:
1. Clean build folder (Cmd+Shift+K)
2. Close Xcode
3. Delete DerivedData:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/Copse-*
   ```
4. Reopen Xcode
5. Build again

---

## 📋 Build Success Checklist

After fixes, you should see:

```
✅ Build Phases → Link Binary With Libraries
   - No XCTest frameworks present
   
✅ Build Settings → ENABLE_TESTING_SEARCH_PATHS
   - Set to "No" for both Debug and Release
   
✅ Clean build completed
   - No cached test artifacts
   
✅ Build succeeds
   - Press Cmd+B → "Build Succeeded"
```

---

## 🎉 After Successful Build

Once the build succeeds:

1. **Run the app**: Press Cmd+R
2. **Test login**: Use Google Sign-In
3. **Check chat**: Tap the Chat card
4. **Verify**: Should see ChatChannelListView

---

## 🆘 Still Having Issues?

### Check Console Logs
```
In Xcode:
View → Debug Area → Show Debug Area (Cmd+Shift+Y)

Look for messages starting with:
🔴 - Errors
⚠️  - Warnings
✅ - Success
```

### Verify Package Dependencies
```
1. Copse target → Package Dependencies
2. Should see:
   - Firebase packages ✅
   - Google Sign-In ✅
   - StreamChat ✅
   - StreamChatUI ✅
```

### Check Deployment Target
```
Copse target → General → Minimum Deployments
Should be: iOS 15.0 or higher
```

---

## 💡 Pro Tips

### Always Clean Before Major Changes
```bash
# Terminal shortcut
cd ~/Library/Developer/Xcode/DerivedData
rm -rf Copse-*
```

### Check for Multiple Targets
- Make sure you're editing the **Copse app target**, not a test target
- Test targets should have "Tests" in their name

### Verify Framework Linking
- Most frameworks should come from Swift Package Manager
- Only system frameworks should be directly linked

---

## 📞 Quick Reference Commands

```bash
# Clean build artifacts
rm -rf ~/Library/Developer/Xcode/DerivedData/Copse-*

# Run the fix script
cd /Users/christophersmith/Documents/GitHub/pack1703-portal/ios/Copse
./fix-build.sh
```

---

**After following these steps, your build should succeed!** 🎉

Then you can continue with adding the Stream Chat SDK and testing the chat functionality.

