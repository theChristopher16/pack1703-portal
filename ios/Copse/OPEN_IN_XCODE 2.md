# 🚀 Open Copse in Xcode - Quick Guide

## 📂 Step 1: Open the Project

### Option A: From Finder
1. Navigate to: `/Users/christophersmith/Documents/GitHub/pack1703-portal/ios/Copse/`
2. Double-click on **`Copse.xcodeproj`** (the blue Xcode icon)

### Option B: From Terminal
```bash
cd /Users/christophersmith/Documents/GitHub/pack1703-portal
open ios/Copse/Copse.xcodeproj
```

### Option C: From Xcode
1. Open Xcode
2. Choose "Open a project or file"
3. Navigate to the Copse.xcodeproj file
4. Click "Open"

---

## 📦 Step 2: Add Stream Chat SDK

**This is the critical step to make chat work!**

### Visual Guide:

```
Xcode Sidebar
  ├─ 📘 Copse (Project - click this!)
  │   ├─ 🎯 Copse (Target)
  │   │   ├─ General
  │   │   ├─ Signing & Capabilities  
  │   │   ├─ Resource Tags
  │   │   ├─ Info
  │   │   ├─ Build Settings
  │   │   ├─ Build Phases
  │   │   ├─ Build Rules
  │   │   └─ ⭐ Package Dependencies  ← Click here!
```

### Detailed Steps:

1. **Select the Project**
   - In the left sidebar, click the blue **Copse** icon (the very top)
   - NOT the folder, the project file itself

2. **Select the Target**
   - In the main area, make sure **Copse** target is selected
   - It should be in the "PROJECT" and "TARGETS" list

3. **Go to Package Dependencies**
   - Click the **"Package Dependencies"** tab at the top
   - You'll see a list of current packages (Firebase, Google Sign-In)

4. **Add Stream Chat**
   - Click the **"+"** button at the bottom of the package list
   - A sheet will appear

5. **Enter Repository URL**
   - In the search field, paste exactly:
     ```
     https://github.com/GetStream/stream-chat-swift.git
     ```
   - Press Enter or click "Add Package"

6. **Choose Version**
   - Select: **"Up to Next Major Version"**
   - Enter: **4.94.0**
   - Click "Add Package"

7. **Select Products** (IMPORTANT!)
   - A new sheet appears asking which products to add
   - Check the boxes for:
     - ✅ **StreamChat**
     - ✅ **StreamChatUI**
   - Click "Add Package"

8. **Wait for Download**
   - Xcode will download the packages (1-2 minutes)
   - You'll see "Fetching..." at the bottom
   - When done, both packages appear in the dependencies list

---

## 🏗️ Step 3: Build the Project

### Quick Build
- Press **Cmd + B** (⌘B)
- Or: Menu → Product → Build

### Expected Output:
```
Build Succeeded ✅
```

### If Build Fails:
- Check that you added BOTH StreamChat packages
- Try: Product → Clean Build Folder (Cmd+Shift+K)
- Then build again

---

## 🏃 Step 4: Run the App

### Choose Simulator
1. At the top of Xcode, click the device dropdown
2. Select: **iPhone 15 Pro** (or any modern iPhone)

### Run the App
- Press **Cmd + R** (⌘R)
- Or: Menu → Product → Run
- Or: Click the ▶️ Play button

### Expected Behavior:
1. Simulator launches (may take 30 seconds first time)
2. App appears with Copse launch screen
3. Login screen shows
4. Log in with Google
5. Home screen appears with Chat card visible!

---

## 🧪 Step 5: Test Chat

### Navigate to Chat
1. On home screen, tap the **"Chat"** quick action (green bubble icon)
2. You should see "ChatChannelListView"
3. Look for "Connecting to chat..." (should disappear quickly)

### Create a Channel
1. Tap the **"+"** button (top right)
2. Enter a channel name: "Test Channel"
3. Tap "Create Channel"
4. Channel appears in the list!

### Send a Message
1. Tap the channel you created
2. Type a test message
3. Tap send
4. Message appears! 🎉

---

## 🐛 Troubleshooting

### "Build Failed: No such module 'StreamChat'"
**Fix**: You didn't add the SDK. Go back to Step 2.

### "Provisioning profile issues"
**Fix**:
1. Select Copse target
2. Go to "Signing & Capabilities" tab
3. Check "Automatically manage signing"
4. Select your team

### Simulator won't launch
**Fix**:
- Xcode → Window → Devices and Simulators
- Delete old simulators
- Create a fresh iPhone 15 Pro simulator

### App crashes on launch
**Fix**:
- Check the Xcode console for error messages
- Look for errors starting with "🔴"
- Common issue: Missing GoogleService-Info.plist

---

## 📱 Testing on Real Device

### Prerequisites:
1. Apple Developer account (free or paid)
2. iPhone with iOS 13+
3. USB-C cable

### Steps:
1. Connect iPhone to Mac
2. Unlock iPhone and trust computer
3. In Xcode, select your iPhone from device dropdown
4. Press Cmd+R to build and run
5. First time: iPhone will show "Untrusted Developer"
6. Fix: Settings → General → VPN & Device Management → Trust

---

## 🎯 Success Checklist

- [ ] Xcode opened Copse.xcodeproj
- [ ] Added StreamChat + StreamChatUI packages
- [ ] Build succeeded (Cmd+B)
- [ ] App runs in simulator (Cmd+R)
- [ ] Login works
- [ ] Home screen shows
- [ ] Chat card visible
- [ ] Can navigate to chat
- [ ] Connection successful
- [ ] Can create channel
- [ ] Can send messages

---

## 📚 Next Steps

Once chat is working:

1. **Read the Test Checklist**: `TEST_CHECKLIST.md`
2. **Review Integration Docs**: `INTEGRATION_COMPLETE.md`
3. **Customize Appearance**: Edit `ChatConversationView.swift`
4. **Create Den Channels**: Use `createDenChannel()` method
5. **Set Up Push Notifications**: Configure FCM tokens

---

## 🆘 Still Need Help?

### Check These Files:
- `QUICKSTART.md` - Quick setup overview
- `STREAM_CHAT_SETUP.md` - Detailed setup guide
- `TEST_CHECKLIST.md` - Testing procedures
- `INTEGRATION_COMPLETE.md` - Full documentation

### Common Resources:
- **Stream Chat Dashboard**: https://getstream.io/dashboard/
- **Stream iOS Docs**: https://getstream.io/chat/docs/sdk/ios/
- **Firebase Console**: https://console.firebase.google.com/

---

**Ready? Let's open Xcode and start chatting! 💬🌲**

