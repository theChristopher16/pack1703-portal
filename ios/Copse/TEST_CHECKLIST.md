# 🧪 Stream Chat Integration - Test Checklist

Follow these steps to test the Stream Chat integration in Copse.

## ✅ Pre-Testing Checklist

### 1. Get Stream Chat Credentials
- [ ] Go to https://getstream.io/chat/
- [ ] Sign up or log in
- [ ] Create a new app (or use existing)
- [ ] Copy your **API Key** (looks like: `abcd1234efgh`)
- [ ] Copy your **API Secret** (looks like: `xyz789abc456def...`)

### 2. Update Info.plist
- [ ] Open `ios/Copse/Info.plist`
- [ ] Find the line: `<string>YOUR_STREAM_API_KEY_HERE</string>`
- [ ] Replace `YOUR_STREAM_API_KEY_HERE` with your actual Stream API Key

### 3. Add Stream Chat SDK in Xcode

**This is the critical step!**

1. Open `Copse.xcodeproj` in Xcode
2. Select the **Copse** project in the navigator (blue icon at top)
3. Select the **Copse** target (not the project)
4. Click the **"Package Dependencies"** tab
5. Click the **"+"** button at the bottom
6. In the search field, paste: `https://github.com/GetStream/stream-chat-swift.git`
7. Click **"Add Package"**
8. Select version rule: **"Up to Next Major Version"** with **4.94.0**
9. Click **"Add Package"** again
10. When prompted to select products, check:
    - ✅ **StreamChat**
    - ✅ **StreamChatUI**
11. Click **"Add Package"** one more time

Xcode will download and integrate the SDK (may take 1-2 minutes).

### 4. Configure Firebase Cloud Functions

```bash
# Navigate to functions directory
cd /Users/christophersmith/Documents/GitHub/pack1703-portal/functions

# Set Stream Chat credentials in Firebase config
firebase functions:config:set stream.api_key="YOUR_STREAM_API_KEY"
firebase functions:config:set stream.api_secret="YOUR_STREAM_API_SECRET"

# Verify it's set correctly
firebase functions:config:get

# Deploy the Stream Chat functions
firebase deploy --only functions:generateStreamChatToken,functions:createStreamChatChannel,functions:addUserToOrganizationChannels
```

**Expected output:**
```
✔  functions[generateStreamChatToken(us-central1)] Successful update operation.
✔  functions[createStreamChatChannel(us-central1)] Successful update operation.
✔  functions[addUserToOrganizationChannels(us-central1)] Successful update operation.
```

## 🧪 Testing Steps

### Test 1: Build the App
- [ ] In Xcode, select a simulator (iPhone 15 Pro recommended)
- [ ] Press **Cmd+B** to build
- [ ] **Expected**: Build succeeds with no errors
- [ ] **If build fails**: Check that you added both StreamChat packages

### Test 2: Launch & Login
- [ ] Press **Cmd+R** to run the app
- [ ] **Expected**: App launches to login screen
- [ ] Log in with your Firebase account (Google Sign-In)
- [ ] **Expected**: Login succeeds, app shows UserHomeView

### Test 3: Navigate to Chat
- [ ] On the home screen, look for the "Chat" quick action (green bubble icon)
- [ ] **Expected**: See "Chat" card with message icon
- [ ] Tap the "Chat" card
- [ ] **Expected**: Navigate to ChatChannelListView

### Test 4: Check Connection Status
- [ ] Look at the top of the chat screen
- [ ] **Expected**: Should show "Connecting to chat..." briefly
- [ ] **Expected**: Then it disappears (meaning connection successful)
- [ ] **If stuck on "Connecting"**: 
  - Check Xcode console for "🔴 StreamChat:" errors
  - Verify Cloud Functions are deployed
  - Check Firebase Auth is working

### Test 5: Create a Channel
- [ ] Tap the "+" button in the top right
- [ ] **Expected**: Sheet appears with "New Channel" title
- [ ] Type a channel name (e.g., "Test Channel")
- [ ] Tap "Create Channel" button
- [ ] **Expected**: 
  - Button shows loading spinner
  - Sheet dismisses
  - New channel appears in the list

**⚠️ Note**: If channel creation fails, check:
```bash
firebase functions:log --only generateStreamChatToken,createStreamChatChannel
```

### Test 6: Open a Channel
- [ ] Tap on your created channel
- [ ] **Expected**: Navigation to ChatConversationView
- [ ] **Expected**: See the Stream Chat UI with:
  - Channel name in nav bar
  - Message input at bottom
  - Glassmorphism background matching Copse design

### Test 7: Send a Message
- [ ] Type a test message in the input field
- [ ] Tap the send button (paper plane icon)
- [ ] **Expected**: Message appears in the chat
- [ ] **Expected**: Message has your name and profile picture

### Test 8: Test Features
- [ ] Type `@` to trigger mentions
- [ ] Type `/` to see chat commands
- [ ] Type `/giphy hello` to send a GIF
- [ ] Tap the attachment button to send an image
- [ ] **Expected**: All features work smoothly

### Test 9: Navigate Back
- [ ] Tap "Back" in the top left
- [ ] **Expected**: Return to channel list
- [ ] **Expected**: Your channel still shows with last message preview

### Test 10: Check Unread Count
- [ ] Have a friend send you a message (or use Stream Dashboard)
- [ ] Go back to home screen
- [ ] **Expected**: Red badge on Chat card showing unread count

## 🐛 Common Issues & Fixes

### Issue: Build error "No such module 'StreamChat'"
**Fix**: You didn't add the SDK packages. Go back to Step 3.

### Issue: "Token generation not implemented"
**Fix**: 
1. Verify Cloud Functions are deployed: `firebase deploy --only functions:generateStreamChatToken`
2. Check Firebase config: `firebase functions:config:get`
3. Look at Cloud Functions logs: `firebase functions:log`

### Issue: "Not connected to Stream Chat"
**Fix**:
1. Check Firebase Auth is working
2. Verify API Key in Info.plist is correct
3. Look for console errors starting with "🔴 StreamChat:"
4. Try restarting the app

### Issue: Channels not loading
**Fix**:
1. Check network connectivity
2. Verify you're logged in to Firebase
3. Create a channel first - empty state is expected
4. Look for errors in Xcode console

### Issue: Can't send messages
**Fix**:
1. Verify you're a member of the channel
2. Check internet connection
3. Look for errors in Stream Chat logs
4. Try recreating the channel

## 📊 Success Criteria

✅ **Integration Successful If:**
- [ ] App builds without errors
- [ ] Login works
- [ ] Chat screen loads
- [ ] Connection status shows "connected"
- [ ] Can create channels
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Glassmorphism design looks beautiful
- [ ] No console errors related to StreamChat

## 🎉 What to Test Next

Once basic functionality works:

1. **Multi-device**: Open the same channel on two devices
2. **Offline**: Turn off wifi, send messages, turn back on
3. **Attachments**: Send photos, videos, files
4. **GIFs**: Use `/giphy` command
5. **Reactions**: Long-press a message to react
6. **Threads**: Reply to a message to start a thread
7. **Push Notifications**: Send a message when app is closed

## 📝 Testing Notes

Use this space to record any issues or observations:

```
Date: ___________
Tester: ___________

✅ What Worked:
-

⚠️ Issues Found:
-

💡 Suggestions:
-
```

## 🆘 Need Help?

If you encounter issues:

1. Check the Xcode console for error messages
2. Look at Cloud Functions logs: `firebase functions:log`
3. Visit Stream Chat Dashboard: https://getstream.io/dashboard/
4. Check the documentation:
   - `QUICKSTART.md` - Quick setup guide
   - `STREAM_CHAT_SETUP.md` - Detailed setup
   - `INTEGRATION_COMPLETE.md` - Full technical docs

## 🎯 Expected Console Output

When everything works correctly, you should see in Xcode console:

```
✅ StreamChat: Initialized with API key
🔵 FirebaseService: Starting Google Sign-In...
✅ StreamChat: User connected - <user-id>
🔵 StreamChat: Loaded 0 channels (first time)
```

If you see errors starting with "🔴 StreamChat:", that indicates an issue that needs fixing.

---

**Ready to test? Start with the Pre-Testing Checklist above!** 🚀

