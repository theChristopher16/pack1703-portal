# Firebase Cloud Messaging (FCM) Setup Guide for iOS

This guide explains how to set up push notifications for the Copse iOS app using Firebase Cloud Messaging.

## ✅ Implementation Complete

The following components have been implemented:

1. **MessagingService** (`Services/MessagingService.swift`)
   - Handles FCM token registration
   - Manages notification permissions
   - Stores tokens in Firestore
   - Handles foreground and background notifications

2. **AppDelegate** (`App/AppDelegate.swift`)
   - Handles remote notification registration
   - Processes background notifications
   - Integrates with Firebase Messaging

3. **CopseApp Updates** (`App/CopseApp.swift`)
   - Initializes messaging on app launch
   - Requests notification permissions
   - Registers FCM tokens automatically

4. **FirebaseService Integration** (`Services/FirebaseService.swift`)
   - Automatically registers FCM token on login
   - Removes FCM token on logout

5. **NotificationSettingsView** (`Views/NotificationSettingsView.swift`)
   - User interface for managing notification preferences
   - Shows permission status
   - Allows users to enable/disable notifications

## 🔧 Required Xcode Configuration

### Step 1: Add Push Notifications Capability

1. Open the project in Xcode
2. Select the **Copse** target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability**
5. Add **Push Notifications**

### Step 2: Configure Background Modes

1. In the same **Signing & Capabilities** tab
2. Add **Background Modes** capability (if not already present)
3. Check **Remote notifications**

### Step 3: Configure APNs in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pack1703-portal**
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Under **Apple app configuration**, upload your APNs Authentication Key:
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Navigate to **Certificates, Identifiers & Profiles** → **Keys**
   - Create a new key with **Apple Push Notifications service (APNs)** enabled
   - Download the `.p8` key file
   - Upload it to Firebase Console
   - Enter your **Key ID** and **Team ID**

### Step 4: Verify Info.plist

The `Info.plist` should already have:
- `UIBackgroundModes` with `remote-notification` ✅ (Already configured)

## 📱 How It Works

### Token Registration Flow

1. **App Launch**: 
   - App requests notification permission (if not already granted)
   - Registers for remote notifications
   - FCM token is automatically obtained

2. **User Login**:
   - When user logs in, FCM token is saved to Firestore
   - Token is stored in `users/{userId}` document with fields:
     - `fcmToken`: The FCM token string
     - `fcmTokenUpdatedAt`: Timestamp
     - `platform`: "ios"

3. **User Logout**:
   - FCM token is removed from Firestore
   - Token is cleared from local storage

### Notification Handling

- **Foreground**: Notifications are displayed as banners even when app is open
- **Background**: Notifications are handled by the system
- **Tapped**: Custom navigation based on notification data (eventId, channelId, etc.)

## 🧪 Testing Push Notifications

### Method 1: Using Firebase Console

1. Go to Firebase Console → **Cloud Messaging**
2. Click **Send test message**
3. Enter your FCM token (available in NotificationSettingsView)
4. Compose and send a test notification

### Method 2: Using Cloud Functions

The backend already has notification sending capabilities. You can trigger notifications from:
- Event creation/updates
- Announcements
- Chat messages
- Admin notifications

### Method 3: Using cURL

```bash
curl -X POST https://fcm.googleapis.com/v1/projects/pack1703-portal/messages:send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "YOUR_FCM_TOKEN",
      "notification": {
        "title": "Test Notification",
        "body": "This is a test push notification"
      },
      "data": {
        "eventId": "optional-event-id"
      }
    }
  }'
```

## 📋 Notification Payload Structure

The app expects notifications in this format:

```json
{
  "aps": {
    "alert": {
      "title": "Event Reminder",
      "body": "Pack meeting starts in 1 hour!"
    },
    "badge": 1,
    "sound": "default"
  },
  "eventId": "optional-event-id",
  "channelId": "optional-channel-id",
  "type": "event|announcement|message|admin"
}
```

## 🔍 Debugging

### Check FCM Token

1. Open the app
2. Go to **Settings** → **Notifications** (or wherever you've added NotificationSettingsView)
3. View the FCM token in the debug section

### Check Firestore

1. Go to Firebase Console → **Firestore Database**
2. Navigate to `users/{userId}`
3. Verify `fcmToken` field exists and is populated

### Common Issues

1. **No token received**:
   - Check that Push Notifications capability is enabled in Xcode
   - Verify APNs key is uploaded to Firebase
   - Check device is connected to internet

2. **Permission denied**:
   - User must enable in iOS Settings
   - App can prompt to open Settings

3. **Token not saved to Firestore**:
   - Check user is authenticated
   - Verify Firestore rules allow write access
   - Check network connectivity

## 🚀 Next Steps

1. **Add NotificationSettingsView to your app navigation**:
   - Add it to a settings screen or profile view
   - Or create a dedicated settings tab

2. **Implement notification navigation**:
   - Update `handleNotificationTap` in MessagingService
   - Add navigation to specific events/channels based on notification data

3. **Add notification preferences**:
   - Store user preferences in Firestore (similar to web app)
   - Allow users to opt-in/opt-out of specific notification types

4. **Test with real notifications**:
   - Send notifications from backend when events are created
   - Test announcement notifications
   - Test chat message notifications

## 📚 Additional Resources

- [Firebase Cloud Messaging iOS Documentation](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

---

**Note**: Make sure to complete the Xcode configuration steps (Push Notifications capability and APNs key upload) before testing push notifications in production.

