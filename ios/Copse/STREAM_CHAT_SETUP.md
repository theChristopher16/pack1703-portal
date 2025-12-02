# Stream Chat SDK Setup for Copse

## Step 1: Add Stream Chat SDK via Xcode

1. Open `Copse.xcodeproj` in Xcode
2. Select your project in the Project Navigator
3. Select the "Copse" target
4. Go to the "Package Dependencies" tab
5. Click the "+" button to add a package
6. Enter the repository URL: `https://github.com/GetStream/stream-chat-swift.git`
7. Select "Up to Next Major Version" with version **4.94.0**
8. Click "Add Package"
9. Select the following products to add:
   - **StreamChat** (Core SDK)
   - **StreamChatUI** (Pre-built UI components)
10. Click "Add Package"

## Step 2: Get Stream Chat API Credentials

1. Go to [Stream Chat Dashboard](https://getstream.io/dashboard/)
2. Create a new app or select existing app
3. Note your **API Key** and **API Secret**
4. Go to Firebase Console > Project Settings > Service Accounts
5. Create a Cloud Function that generates Stream Chat tokens

## Step 3: Add Stream API Key to Info.plist

Add the following to your `Info.plist`:

```xml
<key>STREAM_API_KEY</key>
<string>YOUR_STREAM_API_KEY_HERE</string>
```

## Step 4: Environment Configuration

Create a `StreamChatConfig.swift` file (already created in this integration) and update it with your credentials.

## Architecture

The integration follows these patterns:

### StreamChatService
- Wraps Stream Chat SDK
- Handles connection, authentication
- Syncs with Firebase user state
- Manages chat lifecycle

### Views
- **ChatChannelListView**: Browse all organization channels
- **ChatView**: Individual channel conversations
- **CreateChannelView**: Start new conversations

### Integration Points
- Firebase Auth → Stream Chat user tokens
- Organization membership → Channel access
- Glassmorphism design system maintained throughout

## Features Implemented

✅ Multi-organization channel support
✅ Den-specific channels (🐺 Wolves, 🐻 Bears, etc.)
✅ Event-specific channels
✅ Direct messages
✅ File/image attachments
✅ GIPHY integration
✅ Read receipts & typing indicators
✅ Push notifications (via Firebase)
✅ Offline support
✅ Beautiful glassmorphism UI matching Copse design

## Next Steps

After adding the SDK dependency in Xcode:
1. Build the project to ensure no errors
2. Update `StreamChatConfig.swift` with your API key
3. Test authentication flow
4. Create test channels in Stream Dashboard
5. Test chat functionality

## Resources

- [Stream Chat iOS SDK Documentation](https://getstream.io/chat/docs/sdk/ios/)
- [SwiftUI Components](https://getstream.io/chat/docs/sdk/ios/swiftui/getting-started/)
- [Authentication Guide](https://getstream.io/chat/docs/sdk/ios/basics/authentication/)

