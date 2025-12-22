# 🔧 Fix XCTest Linker Errors - Step by Step

## The Problem
XCTest frameworks are linked to your **main app target**. They should ONLY be in test targets.

## ✅ Follow These Steps Exactly

### Step 1: Open Build Phases
1. **In Xcode left sidebar**: Click the blue **"Copse"** icon (the project)
2. **In center area**: Under **TARGETS**, select **"Copse"** (the app icon)
3. **At the top**: Click the **"Build Phases"** tab

### Step 2: Find "Link Binary With Libraries"
1. Look for a section called **"Link Binary With Libraries"**
2. Click the **disclosure triangle** to expand it
3. You'll see a list of frameworks

### Step 3: Remove XCTest Frameworks
Look through the list and **remove** any of these:
- ❌ `XCTest.framework`
- ❌ `XCTestSwiftSupport`
- ❌ `XCUIAutomation.framework`
- ❌ Anything with "Test" in the name

**To remove:**
1. Click on the framework name
2. Click the **"-"** (minus) button at the bottom
3. Repeat for each test framework

### Step 4: Check Build Settings
1. Still on the Copse target, click **"Build Settings"** tab
2. In the search box, type: `ENABLE_TESTING_SEARCH_PATHS`
3. Find the setting and change it to **"No"** for both Debug and Release

### Step 5: Clean and Build
1. **Product** → **Clean Build Folder** (Cmd+Shift+K)
2. **Product** → **Build** (Cmd+B)

## 🎯 Visual Guide

```
Xcode Window Layout:

Left Sidebar:
  ┌─────────────────┐
  │ 📘 Copse        │ ← Click this (blue project icon)
  │   ├─ Copse/     │
  │   ├─ Models/    │
  │   └─ ...        │
  └─────────────────┘

Center Area (after clicking project):
  PROJECT           TARGETS
  ┌──────────┐     ┌──────────────────┐
  │ Copse    │     │ 🎯 Copse         │ ← Select this
  └──────────┘     └──────────────────┘

Top Tabs (after selecting target):
  ┌──────────────────────────────────────────┐
  │ General | Signing | Info | Build Settings│
  │ Build Phases | Build Rules | Package Deps│ ← Click "Build Phases"
  └──────────────────────────────────────────┘

In Build Phases:
  ▾ Link Binary With Libraries (X items)
    ├─ SwiftUI.framework
    ├─ FirebaseAuth (package)
    ├─ StreamChat (package)
    ├─ XCTest.framework          ← DELETE THIS
    ├─ XCTestSwiftSupport        ← DELETE THIS
    └─ ...
```

## 🔍 How to Identify Test Frameworks
They will have one of these in the name:
- "Test"
- "XCTest"
- "XCUIAutomation"
- "Testing"

**Don't delete:**
- Firebase packages ✅
- Google Sign-In ✅
- StreamChat ✅
- System frameworks (SwiftUI, UIKit, etc.) ✅

## ⚠️ Common Mistakes

### ❌ Wrong: Deleting from Project Navigator
Don't delete files from the left sidebar!

### ❌ Wrong: Editing the wrong target
Make sure you're editing **"Copse"** target, not a test target

### ✅ Correct: Removing from Build Phases
Remove frameworks from the "Link Binary With Libraries" section

## 🆘 If You Can't Find XCTest Frameworks

If you don't see XCTest in "Link Binary With Libraries", try:

### Option 1: Check Other Linker Flags
1. Go to **Build Settings** tab
2. Search for: `OTHER_LDFLAGS`
3. Look for any `-framework XCTest` entries
4. Remove them

### Option 2: Check the .pbxproj directly
This is advanced - only if above doesn't work:
```bash
cd /Users/christophersmith/Documents/GitHub/pack1703-portal/ios/Copse
grep -n "XCTest" Copse.xcodeproj/project.pbxproj
```
This will show you where XCTest is referenced.

## 📸 What Success Looks Like

After removing test frameworks:
```
▾ Link Binary With Libraries
  ├─ SwiftUI.framework ✅
  ├─ FirebaseAuth (package) ✅
  ├─ FirebaseCore (package) ✅
  ├─ GoogleSignIn (package) ✅
  ├─ StreamChat (package) ✅
  ├─ StreamChatUI (package) ✅
  └─ ... other valid frameworks
  
  NO XCTest frameworks! ✅
```

Then build succeeds! 🎉

## 🎯 Quick Checklist

- [ ] Selected Copse **target** (not project)
- [ ] Opened Build Phases tab
- [ ] Expanded "Link Binary With Libraries"
- [ ] Removed all XCTest frameworks
- [ ] Set ENABLE_TESTING_SEARCH_PATHS to "No"
- [ ] Cleaned build folder (Cmd+Shift+K)
- [ ] Tried building (Cmd+B)

## 💡 Why This Happens

Stream Chat SDK includes test tools (StreamChatTestTools, StreamChatTestMockServer) which may have auto-linked XCTest. We need to manually remove them from the main app target.

---

**Follow the steps above and let me know when XCTest frameworks are removed!**

Then try building again.

